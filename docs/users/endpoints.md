# Users API Endpoints

**Base URL:** `http://localhost:8000/api/auth`

---

### Register

**POST** `/register/`

Request body:
```json
{
  "email": "test@test.com",
  "first_name": "John",
  "last_name": "Doe",
  "password": "Str0ngPass!",
  "password2": "Str0ngPass!"
}
```

---

### Login

**POST** `/login/`

Request body:
```json
{
  "email": "test@test.com",
  "password": "Str0ngPass!"
}
```

Response includes `access` and `refresh` tokens.

---

### Refresh Token

**POST** `/token/refresh/`

Request body:
```json
{
  "refresh": "<your_refresh_token>"
}
```

---

### Logout

**POST** `/logout/`

Header: `Authorization: Bearer <access_token>`

Request body:
```json
{
  "refresh": "<your_refresh_token>"
}
```

---

### Get Current User

**GET** `/me/`

Header: `Authorization: Bearer <access_token>`

---

### Update Current User

**PATCH** `/me/`

Header: `Authorization: Bearer <access_token>`

Request body (any updatable fields):
```json
{
  "first_name": "Jane"
}
```
