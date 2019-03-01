# Snapchat clone API

very quick and dirty snapchat clone api

## Endpoints

### Users

```js
// list all the users

GET /users \
-H Authorization: bearer access_token

[{
	id: Number,
	username: String
}]
```

```js
// create a new user

POST /users \
-H Content-Type: application/json \
-d { username: String }
```

```js
// send a snap to a specific user

POST /users/:id/snap \
-H Authorization: bearer access_token \
-F snap:@path/to/file
```

### Snaps

```js
// list all the snaps for a user

GET /snaps \
-H Authorization: bearer access_token

[{
	from: String,
	url: String
}]
```

```js
// get snap image file

GET /snaps/:id \
-H Authorization: bearer access_token
```

