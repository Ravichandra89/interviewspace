import handleCodeSubmission from "./handlers/codeSubmissionHandler";

// Start the code execution service
(async () => {
  try {
    await handleCodeSubmission();
    console.log("Execution Service started successfully");
  } catch (error) {
    console.error("Fatal error starting Execution Service: ", error);
    process.exit(1);
  }
})();
