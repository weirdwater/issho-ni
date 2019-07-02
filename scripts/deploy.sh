#!/bin/bash

# Unofficial strict mode
set -euo pipefail
IFS=$'\n\t'

#/ Usage: ./deploy.sh
#/ Description: Will build a docker image and deploy it to the server
#/ Examples:
#/ Options
#/   --help will display this help message
usage() { grep '^#/' "$0" | cut -c4- ; exit 0 ; }
expr "$*" : ".*--help" > /dev/null && usage

CRED='\033[0;31m'
CYAN='\033[0;36m'
YLLW='\033[1;33m'
NC='\033[0m'

readonly LOG_FILE="/tmp/$(basename "$0").log"
info()    { echo -e "${CYAN}[INFO]    $* ${NC}" | tee -a "$LOG_FILE" >&2 ; }
warning() { echo -e "${YLLW}[WARNING] $* ${NC}" | tee -a "$LOG_FILE" >&2 ; }
error()   { echo -e "${CRED}[ERROR]   $* ${NC}" | tee -a "$LOG_FILE" >&2 ; }
fatal()   { echo -e "${CRED}[FATAL]   $* ${NC}" | tee -a "$LOG_FILE" >&2 ; exit 1 ; }

project="issho-ni"
server="issho.app"
remoteDir="/var/docker/issho-ni"
build=$(date "+%Y%m%d%H%M")
branch=$(git rev-parse --abbrev-ref HEAD)
commit=$(git log -n 1 --pretty=format:"%H")
imageArchive="${project}-${build}.tar"
release="${project}@${commit}"

cleanup() {
  info "Cleanup"
	rm "$imageArchive"
  ssh -t "$server" "rm ${imageArchive}"
}

if [[ "${BASH_SOURCE[0]}" = "$0" ]]; then
	trap cleanup EXIT

  info "Starting build ${build} for ${project}"
  docker build --build-arg "BUILD_NUMBER=${build}" --build-arg "GIT_BRANCH=${branch}" --build-arg "GIT_COMMIT=${commit}" --build-arg "SENTRY_RELEASE=${release}" -t "${project}:${build}" -t "${project}:latest" .
  info "Archiving image for ${project}"
  docker save -o "$imageArchive" "${project}:${build}"

  if [[ -r "$imageArchive.tmp" ]] ; then
    fatal "Image archive was not successfully built."
  fi

  info "Uploading archive to server"
  scp "$imageArchive" "${server}:"
  info "Loading image from archive"
  ssh -t "$server" "docker load -i ${imageArchive}"
  info "Tagging image with latest"
  ssh -t "$server" "docker tag ${project}:${build} ${project}:latest"
  info "Restarting composed application"
  ssh -t "$server" "cd ${remoteDir} && docker-compose down && docker-compose up -d"
fi
