pipeline {
    agent { label 'built-in' }
    environment {
        AWS_ACCESS_KEY_ID = credentials('aws-access-key-id')
        AWS_SECRET_ACCESS_KEY = credentials('aws-secret-access-key')
        AWS_DEFAULT_REGION = 'eu-north-1'
        ECR_REPO = '783582067637.dkr.ecr.eu-north-1.amazonaws.com/arqc-frontend'
    }
    stages {
        stage('Unit Tests') {
            steps {
                sh '''
                    docker run --rm -v $(pwd):/app -w /app node:24-alpine sh -c "
                        apk add --no-cache chromium &&
                        export CHROME_BIN=/usr/bin/chromium-browser &&
                        npm install &&
                        npm run test -- --watch=false --browsers=ChromeHeadlessNoSandbox
                    "
                '''
            }
        }
        stage('Build Image') {
            steps {
                sh 'docker build -t $ECR_REPO:$BUILD_NUMBER -t $ECR_REPO:latest .'
            }
        }
        stage('Push to ECR') {
            steps {
                sh 'aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin $ECR_REPO'
                sh 'docker push $ECR_REPO:$BUILD_NUMBER'
                sh 'docker push $ECR_REPO:latest'
            }
        }
        stage('Deploy') {
            steps {
                sh '''
                    cd /home/ubuntu/deploy
                    docker compose pull frontend
                    docker compose up -d frontend
                '''
            }
        }
    }
}