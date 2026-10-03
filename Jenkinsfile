// EMV Crypto UI (Angular) - CI/CD pipeline
// Unit tests (Vitest) -> dependency audit -> build image (Angular build + Nginx) -> image scan
// -> push to Amazon ECR -> deploy.
// Security: npm audit checks the libraries shipped to the browser, Trivy scans the whole image.
// A known vulnerability stops the build before anything is pushed or deployed.
// AWS access comes from the server's IAM role (emv-crypto-ec2-role): no keys stored in Jenkins.
pipeline {
    agent any

    options {
        timestamps()
        disableConcurrentBuilds()
        buildDiscarder(logRotator(numToKeepStr: '10'))
    }

    environment {
        AWS_REGION = 'eu-north-1'
        REGISTRY   = '783582067637.dkr.ecr.eu-north-1.amazonaws.com'
        IMAGE      = "${REGISTRY}/emv-crypto-ui"
        DEPLOY_DIR = '/home/ubuntu/deploy'
    }

    stages {
        stage('Unit Tests') {
            steps {
                // Runs the Angular tests in a throwaway Node container that shares this workspace.
                sh '''
                    docker run --rm --volumes-from jenkins -w "$WORKSPACE" \
                      --user "$(id -u):$(id -g)" -e HOME=/tmp -e CI=true \
                      node:24-alpine sh -c "npm ci --no-audit --no-fund && npx ng test --watch=false"
                '''
            }
        }

        stage('Dependency Scan (npm audit)') {
            steps {
                // Checks the libraries that ship to the browser (production dependencies) against the
                // npm advisory database; fails on HIGH or CRITICAL. Build tools (dev dependencies) never
                // reach users, so they are not part of the gate.
                sh '''
                    rc=0
                    docker run --rm --volumes-from jenkins -w "$WORKSPACE" \
                      --user "$(id -u):$(id -g)" -e HOME=/tmp -e CI=true \
                      node:24-alpine npm audit --omit=dev --audit-level=high > npm-audit-report.txt 2>&1 || rc=$?
                    cat npm-audit-report.txt
                    exit $rc
                '''
            }
            post { always { archiveArtifacts artifacts: 'npm-audit-report.txt', allowEmptyArchive: true } }
        }

        stage('Build Image') {
            steps {
                sh 'docker build -t $IMAGE:$BUILD_NUMBER -t $IMAGE:latest .'
            }
        }

        stage('Image Scan (Trivy)') {
            steps {
                // Scans the built image (OS packages and libraries) for known vulnerabilities.
                // Full HIGH/CRITICAL list is kept as a build artifact; the build fails only on a
                // CRITICAL issue that already has a fix (so a fix is always possible).
                // The vulnerability database is cached in the 'trivy-cache' volume between builds.
                sh '''
                    TRIVY="docker run --rm -v /var/run/docker.sock:/var/run/docker.sock -v trivy-cache:/root/.cache aquasec/trivy:0.56.2"
                    $TRIVY image --quiet --severity HIGH,CRITICAL --format table $IMAGE:$BUILD_NUMBER > trivy-report.txt 2>&1 || true
                    cat trivy-report.txt
                    $TRIVY image --quiet --severity CRITICAL --ignore-unfixed --exit-code 1 $IMAGE:$BUILD_NUMBER
                '''
            }
            post { always { archiveArtifacts artifacts: 'trivy-report.txt', allowEmptyArchive: true } }
        }

        stage('Push to ECR') {
            steps {
                sh '''
                    aws ecr get-login-password --region $AWS_REGION \
                      | docker login --username AWS --password-stdin $REGISTRY
                    docker push $IMAGE:$BUILD_NUMBER
                    docker push $IMAGE:latest
                '''
            }
        }

        stage('Deploy') {
            steps {
                // Starts the UI and the Caddy HTTPS gateway (the API must already be deployed).
                sh '''
                    cd $DEPLOY_DIR
                    docker compose pull frontend caddy
                    docker compose up -d
                '''
            }
        }
    }

    post {
        success { echo "Deployed emv-crypto-ui build ${env.BUILD_NUMBER}" }
        always  { sh 'docker image prune -f || true' }
    }
}
