from flask import Flask, request, render_template, redirect, url_for, session, flash
from flask_sqlalchemy import SQLAlchemy
import bcrypt

app = Flask(__name__)

# ✅ XAMPP MySQL Configuration
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://root:@localhost/npsoms_db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

app.secret_key = 'secret_key'

# ✅ User Model
class User(db.Model):
    __tablename__ = 'user'
    user_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    last_name = db.Column(db.String(100), nullable=False)
    first_name = db.Column(db.String(100), nullable=False)
    middle_name = db.Column(db.String(100), nullable=True)

    email = db.relationship('Email', backref='user', uselist=False, cascade="all, delete-orphan")
    entrykey = db.relationship('EntryKey', backref='user', uselist=False, cascade="all, delete-orphan")


# ✅ Email Model
class Email(db.Model):
    __tablename__ = 'email'
    email_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    email = db.Column(db.String(100), unique=True, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.user_id', ondelete='CASCADE', onupdate='CASCADE'), nullable=False)


# ✅ EntryKey Model (Password)
class EntryKey(db.Model):
    __tablename__ = 'entrykey'
    entrykey_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    entrykey = db.Column(db.String(100), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.user_id', ondelete='CASCADE', onupdate='CASCADE'), nullable=False)

    def __init__(self, entrykey):
        self.entrykey = bcrypt.hashpw(entrykey.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    def check_entrykey(self, entrykey):
        return bcrypt.checkpw(entrykey.encode('utf-8'), self.entrykey.encode('utf-8'))


# ✅ Create database tables
with app.app_context():
    db.create_all()


# ✅ Redirect root to login
@app.route('/')
def index():
    return redirect(url_for('login'))


# ✅ Registration Route
@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        last_name = request.form.get('last_name')
        first_name = request.form.get('first_name')
        middle_name = request.form.get('middle_name')
        email = request.form.get('email')
        entrykey = request.form.get('entrykey')
        confirm_password = request.form.get('confirm_password')

        if not all([last_name, first_name, email, entrykey, confirm_password]):
            flash("Please fill in all required fields.", "warning")
            return redirect(url_for('register'))

        if entrykey != confirm_password:
            flash("Passwords do not match.", "error")
            return redirect(url_for('register'))

        if Email.query.filter_by(email=email).first():
            flash("Email already registered.", "error")
            return redirect(url_for('register'))

        new_user = User(last_name=last_name, first_name=first_name, middle_name=middle_name)
        db.session.add(new_user)
        db.session.commit()

        new_email = Email(email=email, user_id=new_user.user_id)
        new_entrykey = EntryKey(entrykey=entrykey)
        new_entrykey.user_id = new_user.user_id

        db.session.add(new_email)
        db.session.add(new_entrykey)
        db.session.commit()

        flash("Registration successful! Please log in.", "success")
        return redirect(url_for('login'))

    return render_template('register.html')

# ✅ Login Route
@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form.get('email')
        entrykey = request.form.get('entrykey')

        if not email or not entrykey:
            flash("Please enter both email and password.", "warning")
            return redirect(url_for('login'))

        user_email = Email.query.filter_by(email=email).first()
        if user_email:
            user_entrykey = EntryKey.query.filter_by(user_id=user_email.user_id).first()
            if user_entrykey and user_entrykey.check_entrykey(entrykey):
                session['user_id'] = user_email.user_id
                flash("Login successful!", "success")
                return redirect(url_for('dashboard'))

        flash("Invalid email or password.", "error")
        return redirect(url_for('login'))

    return render_template('login.html')

# ✅ Dashboard Route
@app.route('/dashboard')
def dashboard():
    if 'user_id' in session:
        user = User.query.filter_by(user_id=session['user_id']).first()
        return render_template('dashboard.html', user=user)

    flash("Please log in to access the dashboard.", "error")
    return redirect(url_for('login'))


# ✅ Logout Route
@app.route('/logout')
def logout():
    session.pop('user_id', None)
    flash("You have been logged out.", "info")
    return redirect(url_for('login'))


if __name__ == '__main__':
    app.run(debug=True)
