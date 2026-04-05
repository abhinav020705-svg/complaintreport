pipeline {
    agent any

    environment {
        IMAGE_NAME = "complaintreport-backend"
        CONTAINER_NAME = "complaintreport-backend-container"
        APP_PORT = "3000"
    }

    stages {

        stage('Install Dependencies') {
            steps {
                dir('complaintreport') {
                    bat 'npm install'
                }
            }
        }

        stage('Test: Verify Project Structure') {
            steps {
                dir('complaintreport') {
                    bat '''
                        IF NOT EXIST package.json (
                            echo ERROR: package.json missing!
                            exit /b 1
                        )
                        IF NOT EXIST server.js (
                            echo ERROR: server.js missing!
                            exit /b 1
                        )
                        IF NOT EXIST tests (
                            echo ERROR: tests folder missing!
                            exit /b 1
                        )
                        IF NOT EXIST Dockerfile (
                            echo ERROR: Dockerfile missing!
                            exit /b 1
                        )
                        echo All required project files are present.
                    '''
                }
            }
        }

        stage('Test: Run Unit Tests') {
            steps {
                dir('complaintreport') {
                    bat 'npm test'
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                bat 'docker build -t %IMAGE_NAME% complaintreport'
            }
        }

        stage('Run Container') {
            steps {
                bat '''
                    docker stop %CONTAINER_NAME% 2>nul
                    docker rm %CONTAINER_NAME% 2>nul
                    FOR /F "tokens=5" %%a IN ('netstat -ano ^| findstr :%APP_PORT%') DO taskkill /PID %%a /F 2>nul
                    docker run -d -p %APP_PORT%:3000 --name %CONTAINER_NAME% %IMAGE_NAME%
                '''
            }
        }
    }

    post {
        success {
            echo "Complaintreport backend is live at: http://localhost:%APP_PORT%"
        }
        failure {
            echo "Build failed. Check the Console Output above for errors."
        }
    }
}