import logging
import time
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint

logger = logging.getLogger("app.middleware.request_logger")

class RequestLoggerMiddleware(BaseHTTPMiddleware):
    """Middleware to log details of every incoming HTTP request and its processing time."""
    
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        start_time = time.perf_counter()
        
        # Extract request info
        client_host = request.client.host if request.client else "unknown"
        method = request.method
        path = request.url.path
        
        logger.info(f"Incoming request: {method} {path} from {client_host}")
        
        try:
            response = await call_next(request)
            
            # Calculate duration in ms
            duration_ms = (time.perf_counter() - start_time) * 1000
            
            # Add process time header to response
            response.headers["X-Process-Time-Ms"] = f"{duration_ms:.2f}"
            
            log_msg = f"Request completed: {method} {path} - Status {response.status_code} in {duration_ms:.2f}ms"
            
            if response.status_code >= 500:
                logger.error(log_msg)
            elif response.status_code >= 400:
                logger.warning(log_msg)
            else:
                logger.info(log_msg)
                
            return response
            
        except Exception as e:
            duration_ms = (time.perf_counter() - start_time) * 1000
            logger.error(f"Request failed: {method} {path} - Exception: {str(e)} in {duration_ms:.2f}ms")
            raise e
