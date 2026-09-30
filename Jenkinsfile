// EMV Crypto UI (Angular) - CI/CD pipeline
// Unit tests (Vitest) -> build image (Angular build + Nginx) -> push to Amazon ECR -> deploy.
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

        stage('Build Image') {
            steps {
                sh 'docker build -t $IMAGE:$BUILD_NUMBER -t $IMAGE:latest .'
            }
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
