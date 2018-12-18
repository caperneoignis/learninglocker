To build image
==============
Build using this command from learninglocker directory, not docker directory:  ````docker build -f docker/Dockerfile -t learninglocker .````

To Run Images
=============
If you want to run api do this ````docker run --port=8080:8080 --env-file docker/dockerfile.env --env SERVICE_TYPE=api --env FIRST_TIME=1 --name app learninglocker````

If you want to run ui do this ````docker run --port=3000:3000 --env-file docker/dockerfile.env --env SERVICE_TYPE=ui --env FIRST_TIME=1 --name app learninglocker````

You can use ````-v .env:/tmp/.env```` if you wish to load the env file through a volume instead of through the --env-file switch statement.
The entrypoint.sh script will pick it up and move it into position, either solution is fine.

Port numbers in run commands are from the dockerfile-env file. You can of course change this to whatever you like.
dockerfile-env is setup for docker-compose. Either way make sure the .env has API_HOST and UI_HOST set to the relevant container name.
In the case of docker-compose it's ui for ui and api for api. In kubernetes you would set it to the internal url of the service.
Which could be ui-dev.local or api-dev.local as an example.

Recommended that nginx is used for routing or something similar. Best usage would be a nginx container
with a sed script that will use an environment variable to update api and ui urls from public to internal urls/ports.
So only one port needs to be exposed and only one url needs to be used to connect to the cluster.

This section is still in the works, so account is created first time automatically but not upon additional usage if DB already has a collection.
So some tweeking still needs to take place.

To run learning locker in a docker-compose/swarm setup
===========================

There is also a docker-compose file which should spin up all instances needed to run Learninglocker
in a network type environment.

To run learning locker in Kubernetes
===================================
**instructions to follow**
In kubernetes you would set it to the internal url of the service.
Which could be ui-dev.local or api-dev.local as an example. But the .env file needs to point
to the correct internal url for the service so both API and UI can communicate to each other.

If also running xapi service which is separate from this repo, you only need to set up the route to 
point to the xapi service. Or point to a nginx instance which then points to the service using the internal
url.

It is highly recommend to use a nginx forwarder or another forwarder to route traffic from outside the cluster
to the container services. May put a nginx container and conf file for usage in Kubernetes and docker compose
at a later time. For use by others.