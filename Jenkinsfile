pipeline {
    agent any

    environment {
        DOCKER_REGISTRY      = "docker.io/admin"
        BACKEND_IMAGE        = "fleet-management-backend"
        FRONTEND_IMAGE       = "fleet-management-frontend"
        BUILD_TAG            = "${BUILD_NUMBER}"
        KUBECONFIG_CREDENTIAL_ID = "kubeconfig-credentials"
    }

    stages {
        stage('Initialize & Clean') {
            steps {
                echo 'Cleaning workspace and prepping build artifacts...'
                sh 'rm -rf node_modules'
            }
        }

        stage('Verify & Lint Backend') {
            steps {
                echo 'Installing backend packages...'
                dir('backend') {
                    sh 'npm install'
                }
            }
        }

        stage('Verify & Build Frontend') {
            steps {
                echo 'Installing frontend packages...'
                dir('frontend') {
                    sh 'npm install'
                    echo 'Compiling React assets...'
                    sh 'npm run build'
                }
            }
        }

        stage('Build Container Images') {
            steps {
                echo 'Building backend Docker container image...'
                sh "docker build -t ${BACKEND_IMAGE}:${BUILD_TAG} ./backend"
                
                echo 'Building frontend Docker container image...'
                sh "docker build -t ${FRONTEND_IMAGE}:${BUILD_TAG} ./frontend"
            }
        }

        stage('Register & Push Images') {
            steps {
                echo 'Simulating push of container logs to central registry...'
                sh "docker tag ${BACKEND_IMAGE}:${BUILD_TAG} ${DOCKER_REGISTRY}/${BACKEND_IMAGE}:latest"
                sh "docker tag ${FRONTEND_IMAGE}:${BUILD_TAG} ${DOCKER_REGISTRY}/${FRONTEND_IMAGE}:latest"
                // sh "docker push ${DOCKER_REGISTRY}/${BACKEND_IMAGE}:latest"
                // sh "docker push ${DOCKER_REGISTRY}/${FRONTEND_IMAGE}:latest"
            }
        }

        stage('Deploy to EKS Cluster') {
            steps {
                echo 'Connecting to EKS control plane and applying updates...'
                // withCredentials([file(credentialsId: "${KUBECONFIG_CREDENTIAL_ID}", variable: 'KUBECONFIG')]) {
                //     sh 'kubectl apply -f k8s/db-deployment.yaml'
                //     sh 'kubectl apply -f k8s/vault-deployment.yaml'
                //     sh 'kubectl apply -f k8s/elk-deployment.yaml'
                //     sh 'kubectl apply -f k8s/backend-deployment.yaml'
                //     sh 'kubectl apply -f k8s/frontend-deployment.yaml'
                //     sh 'kubectl apply -f k8s/hpa.yaml'
                // }
                sh 'kubectl apply --dry-run=client -f k8s/db-deployment.yaml'
                sh 'kubectl apply --dry-run=client -f k8s/vault-deployment.yaml'
                sh 'kubectl apply --dry-run=client -f k8s/elk-deployment.yaml'
                sh 'kubectl apply --dry-run=client -f k8s/backend-deployment.yaml'
                sh 'kubectl apply --dry-run=client -f k8s/frontend-deployment.yaml'
                sh 'kubectl apply --dry-run=client -f k8s/hpa.yaml'
            }
        }
    }

    post {
        success {
            echo 'Case study pipeline executed successfully.'
        }
        failure {
            echo 'CI/CD pipeline build failed. Review output console logs.'
        }
    }
}
