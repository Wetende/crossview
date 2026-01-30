# Deployment Instructions for cPanel

1.  **Prepare Files**:
    - This `deploy` folder contains your helpers.
    - Build your frontend locally: `npm run build` (inside `frontend/`).
    - Collect static files locally: `python manage.py collectstatic --noinput`.
    - Zip the entire project (including `staticfiles` and `deploy` folders, but EXCLUDING `venv`, `node_modules`, `.git`).

2.  **Upload to cPanel**:
    - Go to **Setup Python App** in cPanel.
    - Create App -> Python 3.x -> Domain: yourdomain.com -> App Directory: `crossview`.
    - Copy the command it gives you (e.g., `source /home/user/virtualenv/crossview/3.9/bin/activate`).
    - Go to **File Manager** -> `crossview` folder.
    - Delete default files.
    - Upload and Extract your Zip.

3.  **Configure Files**:
    - **passenger_wsgi.py**: The file from `deploy/passenger_wsgi.py` should be moved to the root (`/home/user/crossview/passenger_wsgi.py`).
    - **.env**: Create a file named `.env` in the root. Copy the content from `deploy/.env.production` and fill in your details (DB info, domain).

4.  **Install Dependencies**:
    - Open **Terminal** in cPanel.
    - Paste the `source` command you copied.
    - Run:
        ```bash
        cd /home/YOUR_USER/crossview
        pip install -r requirements.txt
        pip install mysqlclient
        ```
    - _Note: If `mysqlclient` fails to install due to missing system libraries, try:_
        ```bash
        pip install pymysql
        ```
        _And add these lines to the top of `config/settings/__init__.py`:_
        ```python
        import pymysql
        pymysql.install_as_MySQLdb()
        ```

5.  **Finish Setup**:
    - Run Migrations: `python manage.py migrate`
    - Create Superuser: `python manage.py createsuperuser`
    - Restart App in "Setup Python App" page.
