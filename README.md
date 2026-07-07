# accounting_app
accounting app 

## Connect Supabase to Backend

1. Install backend dependencies:
	```bash
	cd backend
	pip install -r requirements.txt
	```
2. Create an env file from the template:
	```bash
	cp .env.example .env
	```
3. In `backend/.env`, add values from your Supabase project:
	- `SUPABASE_URL` from Supabase Dashboard -> Project Settings -> API -> Project URL
	- `SUPABASE_ANON_KEY` from Supabase Dashboard -> Project Settings -> API -> anon public key
	- `SUPABASE_SERVICE_ROLE_KEY` from Supabase Dashboard -> Project Settings -> API -> service_role key
	- Optional: `SUPABASE_TEST_TABLE` (example: `profiles`) to run a test query

4. Start Django:
	```bash
	cd backend
	python manage.py runserver
	```
5. Test connection:
	- Open `http://127.0.0.1:8000/api/supabase/status`

### Files added for integration

- `backend/api/supabase_client.py`: creates a configured Supabase client.
- `backend/api/views.py`: adds `supabase_status` endpoint.
- `backend/api/urls.py`: exposes `/api/supabase/status`.
- `backend/config/settings.py`: loads `.env` and defines Supabase settings.
