pipeline {
    agent any

    stages {

        stage('Install') {
            steps {
                dir('complaintreport') {
                    bat 'npm install'
                }
            }
        }

        stage('Run') {
            steps {
                dir('complaintreport') {
                    bat 'start /B node server.js'
                }
            }
        }
    }
}