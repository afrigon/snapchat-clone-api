# Snapchat clone API

## Endpoints

### Users

```
// list all the users

GET /users
-H Authorization: bearer access_token

[{
	id: Number,
	username: String
}]
```

```
create a new user

POST /users
-H Content-Type: application/json
-d { username: String }
```

```
send a snap to a specific user

POST /users/:id/snap
-H Authorization: bearer access_token
-F snap:@path/to/file
```

### Snaps

```
list all the snaps for a user

GET /snaps
-H Authorization: bearer access_token

[{
	from: String,
	url: URLString
}]
```

```
get snap image file

GET /snaps/:id
-H Authorization: bearer access_token
```

