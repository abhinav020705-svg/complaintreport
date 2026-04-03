pipeline {
    agent any

    stages {

        stage('Clone') {
            steps {
                git 'https://github.com/abhinav020705-svg/complaintreport.git'
            }
        }

        stage('Install') {
            steps {
                bat 'npm install'
            }
        }

        stage('Run') {
            steps {
                bat 'node server.js'
            }
        }
    }
}