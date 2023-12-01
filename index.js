var admin = require("firebase-admin");
var serviceAccount = require("./keys.json");
var fs = require("fs");
var path = require("path");
var products = require("./productsList.json");
var accountData = require("./variables.json");
const promises = fs.promises;


/****************************************************************************************************/

// NOTAS

// Es necesario keys.json que se obtiene desde firebase. se tiene que colocar al mismo nivel que este archivo.
// IMPORTANTE: Este archivo es privado, no se comparte con nadie.

// los productos deben ser un array con los objetos en un json llamado productsList.json

// collection es el nombre de la collection a la cual subir el objeto
// bucketName es el nombre del bucket a utilizar. Se puede copiar desde la vista principal del bucket en firebase.
//  Tengo entendido que como usamos el bucket default se puede poner .bucket(), pero por las dudas esta implementado asi.
//  Poner esos dos datos en variables.json

// projectName es el nombre del proyecto.

// Las imagenes a subir tienen que estar en la carpeta images con el nombre separado por "_". Es decir,
//  si el nombre del producto es "Buzo negro", la imagen correspondiente tendria que ser buzo_negro.jpeg por ejemplo.
// El parametro que se toma del objeto a subir es "title". O sea que en el objeto tiene que tener {"title": "Buzo negro"} por ejemplo.

// El link generado se agrega usando signedURL, con una fecha muy lejana, por lo que deberia funcionar practicamente siempre. Hay que notar que si se
//  cambia la key utilizada, el link dejara de funcionar.

// Las imagenes/archivos que se suben, se agregan a la carpeta /imagenes_ecommerce en el root del bucket

// Finalmente, para correr el script correr "npm install" y luego "node index.js". Si no salta error porque se realizo todo lo anterior,
//  revisar el storage y el bucket en consola de firebase. Todo deberia estar ahi con los links a las imagenes funcionales, el campo de la url es imageUrl.

/****************************************************************************************************/

const firebaseAdmin = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

/****************************************************************************************************/
// LLENAR!
const collection = accountData.collection;
const bucketName = accountData.bucketName;
/****************************************************************************************************/

const bucket = admin.storage().bucket(bucketName);

// agrega documento a collection
const addData = async (document, imageName) => {
  try {
    await firebaseAdmin.firestore().collection(collection).doc().set(document);
    console.log(
      `Document corresponding to ${imageName} uploaded successfully!`
    );
  } catch (err) {
    console.log("error with document:", document);
    console.log("error:", err);
  }
};

// Sube archivo al bucket
const bucketUpload = async (imageName) => {
  bucket
    .upload("./images/" + imageName, {
      destination: `imagenes_ecommerce/${imageName}`,
    })
    .then((a) => {
      console.log(`${imageName} uploaded to ${bucket.name}.`);
    })
    .catch((err) => {
      console.error("ERROR:", err);
    });
};

// busca los path(nombres de archivos) en carpeta imagenes
const getPaths = async () => {
  const imageDirectory = path.join(process.cwd(), "/images");
  const imageFilenames = await promises.readdir(imageDirectory);
  console.log("imageFilenames:", imageFilenames);
  return imageFilenames;
};

// genera signedUrl para insertar en el objeto/producto
const getUrl = async (imageName) => {
  const file = bucket.file(imageName);
  const [url] = await file.getSignedUrl({
    action: 'read',
    expires: '03-09-2491' // Replace with the expiration date or duration you prefer
  });
  console.log(`Public download URL for ${imageName} generated!`);
  return url;
}

// Funcion que se corre para realizar la operacion. 
const uploadDocumentWithImageLink = async () => {
  const imageNames = await getPaths();
  for (const imageName of imageNames) {
    const data = products.find(
      (e) => e.title.replace(" ", "_").toLowerCase() == imageName.split(".")[0]
    );
    if (data) {
      try {
        await bucketUpload(imageName);
        const url = await getUrl(`imagenes_ecommerce/${imageName}`)
        await addData(
          {
            ...data,
            imageUrl: url,
          },
          imageName
        );
      } catch (err) {
        console.log("error with:", imageName);
        console.log("error:", err);
      }
    }
  }
  console.log("***********************************************************")
  console.log("operacion completada!")
  console.log("***********************************************************")
};

uploadDocumentWithImageLink();
