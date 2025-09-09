import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI(
    debug="True",
    title="VPS Rental API",
    description="API for managing VPS rentals",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
    contact={
        "name": "VPS Rental API Support",
        "url": "http://localhost:8000/docs",
        "email": "support@vpsrentalapi.com",
    },
)

origins = ["*"]

app.add_middleware(
    CORSMiddleware,  # Enable CORS
    allow_origins=origins,  # Allows requests from specified origins (domain FE)
    allow_credentials=True,  # Allows cookies to be sent
    allow_methods=["*"],  # Allows all methods (GET, POST, etc.)
    allow_headers=["*"],  # Allows all headers
)


@app.get("/")
def read_root():
    return {"message": "Welcome to the VPS Rental API!"}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
