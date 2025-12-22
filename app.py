from flask import Flask, render_template

app = Flask(__name__)

# Route for the home page — renders templates/index.html
@app.route("/")
def index():
    return render_template("index.html")

# Optional: run with `python app.py` if you prefer that over the flask CLI
if __name__ == "__main__":
    app.run(debug=True, host="127.0.0.1", port=8080)