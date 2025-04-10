# Use an official Debian image as the base image
FROM debian:bullseye-slim

# Set environment variables
ENV DEBIAN_FRONTEND=noninteractive

# Install Apache Bench (part of the apache2-utils package)
RUN apt-get update && \
    apt-get install -y apache2-utils && \
    apt-get clean

# Set the working directory
WORKDIR /workspace

# Run Apache Bench (ab) when the container starts
ENTRYPOINT ["ab"]
