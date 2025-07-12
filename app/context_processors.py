import time

def inject_cache_version():
    """
    Injects a cache_version variable into the template context.
    This is used for cache busting by appending ?v={{ cache_version }} to static file URLs.
    
    Returns:
        dict: A dictionary containing the cache_version variable
    """
    # Using timestamp as cache version ensures a new version on each server restart
    return {'cache_version': int(time.time())}