from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError


async def validation_exception_handler(req: Request, exc: RequestValidationError):
    """
    Custom exception handler for request validation errors.
    Format error messages by removing unnecessary "Value error, " prefix.

    Args:
        req (Request): The request object.
        exc (RequestValidationError): The exception object.

    Returns:
        JSONResponse: A JSON response with formatted error details.
    """
    errors = []
    for error in exc.errors():
        if error["type"] == "value_error":
            # Remove "Value error, " from message
            msg = error["msg"]
            if msg.startswith("Value error, "):
                msg = msg[13:]  # Remove first 13 characters "Value error, "
            errors.append(
                {
                    "field": " -> ".join(str(x) for x in error["loc"]),
                    "message": msg + ".",
                }
            )
        else:
            errors.append(
                {
                    "field": " -> ".join(str(x) for x in error["loc"]),
                    "message": error["msg"] + ".",
                }
            )
    return JSONResponse(
        status_code=422, content={"detail": "Invalid data!", "errors": errors}
    )


def register_exception_handlers(app):
    """Register custom exception handlers with the FastAPI app"""
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
