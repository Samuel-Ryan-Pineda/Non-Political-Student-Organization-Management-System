from app import create_app
from waitress import serve

app = create_app()

if __name__ == '__main__':
    print("Running in production mode with Waitress")
    serve(app, host='0.0.0.0', port=5000, threads=8, backlog=100)