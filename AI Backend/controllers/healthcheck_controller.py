from datetime import datetime

class HealthCheckController:
    """
    Controller for handling healthcheck operations
    """
    
    def check_health(self):
        """
        Returns the health status of the application
        """
        return {
            "status": "healthy",
            "message": "AI Backend is running successfully",
            "timestamp": datetime.utcnow().isoformat()
        }
