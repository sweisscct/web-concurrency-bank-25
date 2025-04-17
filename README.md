# web-concurrency-bank-25

Command to build the socker image based off the Dockerfile
The image name here is ab
docker build -t ab .  


Command to create and run a container based off the docker image ab
-n is the number of http requests to make
-c is how many concurrent requests to make at once
host.docker.internal specifies that the requests should be made to the machine localhost and not that of the container

docker run ab "-n", "1000", "-c", "10", "http://host.docker.internal:3000/deposit?amount=1"

Exercise:
    Create a second account
    Create a route to allow transfers between accounts
