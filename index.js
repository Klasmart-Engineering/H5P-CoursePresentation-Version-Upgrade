const { MongoClient } = require("mongodb");
const dotenv = require("dotenv");
dotenv.config();
const uri = `${process.env.MONGODB_URL}://${process.env.MONGODB_USER}:${process.env.MONGODB_PASSWORD}@${process.env.HOST}:${process.env.PORT}`;
const client = new MongoClient(uri);

async function updateLibraryVersion() {
  const h5pDatabase = client.db(`${process.env.MONGODB_DB}`);
  const h5pCollection = h5pDatabase.collection(
    `${process.env.CONTENT_MONGO_COLLECTION}`
  );
  try {
    console.log("Updating Collection...");
    const updateDependentLibrary = await h5pCollection.bulkWrite([
      {
        updateMany: {
          filter: {
            $or: [
              { "metadata.mainLibrary": "H5P.Column" },
              { "metadata.mainLibrary": "H5P.CoursePresentation" },
              { "metadata.mainLibrary": "H5P.InteractiveBook" },
            ],
            "metadata.preloadedDependencies.machineName":
              "H5P.CoursePresentation",
            "metadata.preloadedDependencies.majorVersion": parseInt(
              process.env.OLD_MAJOR_VERSION
            ),
            "metadata.preloadedDependencies.minorVersion": parseInt(
              process.env.OLD_MINOR_VERSION
            ),
          },

          update: {
            $set: {
              "metadata.preloadedDependencies.$.machineName":
                "H5P.CoursePresentationKID",
              "metadata.preloadedDependencies.$.majorVersion": parseInt(
                process.env.NEW_MAJOR_VERSION
              ),
              "metadata.preloadedDependencies.$.minorVersion": parseInt(
                process.env.NEW_MINOR_VERSION
              ),
            },
          },
          upsert: false,
        },
      },
    ]);
    console.log("Dependent Library Update", updateDependentLibrary);
  } catch (error) {
    console.log(error);
  }
  try {
    console.log("Updating Collection...");
    const updateMainLibrary = await h5pCollection.bulkWrite([
      {
        updateMany: {
          filter: {
            "metadata.mainLibrary": "H5P.CoursePresentation",
          },

          update: {
            $set: {
              "metadata.mainLibrary": "H5P.CoursePresentationKID",
            },
          },
          upsert: false,
        },
      },
    ]);
    console.log("Main Library Update", updateMainLibrary);
  } catch (error) {
    console.log(error);
  }
}

async function update() {
  try {
    console.log("Connecting to DB...");
    await client.connect();
    console.log("Connected to DB...");
    await updateLibraryVersion();
  } catch (error) {
    console.log(error);
  } finally {
    console.log("Closing connection to DB...");
    await client.close();
    console.log("Connection closed...");
  }
}

update();
