pipeline {
    agent any

    tools {
        nodejs 'nodejs'   // Jenkins Node tool name
    }

    stages {

        stage('Clone') {
            steps {
                git 'https://github.com/abhinav020705-svg/complaintreport'
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'npm install'
            }
        }

        stage('Test') {
            steps {
                echo 'No tests yet'
                // sh 'npm test'
            }
        }

        stage('Run App') {
            steps {
                sh 'node server.js &'
            }
        }
    }
}