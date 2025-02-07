#!/bin/bash

# Function to get a UTC timestamp with a given offset (Cross-Platform)
# Usage: get_utc_timestamp "+1 year"  or get_utc_timestamp "+1 hour"
get_utc_timestamp() {
    local offset="${1:-+1 year}"  # Default to +1 year if no argument is provided

    if command -v gdate &>/dev/null; then
        gdate -u -d "$offset" +"%Y-%m-%dT%H:%M:%SZ"  # GNU date (macOS with coreutils)
    elif date --version &>/dev/null 2>&1; then
        date -u -d "$offset" +"%Y-%m-%dT%H:%M:%SZ"  # GNU date (Linux)
    else
        # BSD date (macOS)
        case "$offset" in
            "+1 year") date -u -v+1y +"%Y-%m-%dT%H:%M:%SZ" ;;
            "+1 hour") date -u -v+1H +"%Y-%m-%dT%H:%M:%SZ" ;;
            *) echo "Unsupported time offset: $offset" >&2; return 1 ;;
        esac
    fi
}

# Function to safely add a Helm repository if it doesn't exist
add_helm_repo() {
    local repo_name="$1"
    local repo_url="$2"
    local extra_args="${3:-}"  # Optional extra args (e.g., auth)

    if ! helm repo list | awk '{print $1}' | grep -qx "$repo_name"; then
        echo "Adding Helm repo: $repo_name"
        helm repo add "$repo_name" "$repo_url" $extra_args
    else
        echo "Helm repo '$repo_name' already exists. Skipping..."
    fi
}
