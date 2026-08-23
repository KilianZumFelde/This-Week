// Extends app.json. Exists only so `android.googleServicesFile` can point at the
// EAS file environment variable GOOGLE_SERVICES_JSON during cloud builds —
// google-services.json is gitignored, so it is not uploaded with the project.
// Locally the env var is unset and the checked-out file is used as before.
module.exports = ({ config }) => ({
  ...config,
  android: {
    ...config.android,
    googleServicesFile:
      process.env.GOOGLE_SERVICES_JSON ?? config.android.googleServicesFile,
  },
});
