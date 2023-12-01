# firebase_script_upload_object_with_image_url

This script requires the media you want to upload, and the objects you need to append the signedUrl to.

- Checks media fil by name and searches for a reference in the array of objects
- When the object is found, it uploads the media file to firebase storage
- Generates a signedUrl with a long expiration time.
- Appends the signed url as imageUrl to the previously found object.
- Upload the modified object with the imageUrl to firestore database.

It was used for a simple ecommerce project. 

