import logging

def setup_logging() -> None:
    """Configures the standard logging format and level for the application."""
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
    )

def get_logger(name: str) -> logging.Logger:
    """Returns a logger instance with the standard naming prefix."""
    return logging.getLogger(f"bidwise.{name}")
