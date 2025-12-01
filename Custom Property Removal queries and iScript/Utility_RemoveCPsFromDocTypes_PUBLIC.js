/**********************************************************************************

	Name:			Utility_RemoveCPsFromDocTypes.js
	Author:			Nicholas Blew
	Created:		11/08/2023
	Updated:		11/08/2023
	For Version:	EP4

********************************************************************************/

//STL packages
#if defined(imagenowDir6)
	#include "$IMAGENOWDIR6$/script/STL/packages/Logging/iScriptDebug.js"
	#include "$IMAGENOWDIR6$/script/STL/packages/Logging/StatsObject.js"
	#include "$IMAGENOWDIR6$/script/STL/packages/Logging/Stopwatch.js"
#else
	#include "../script/STL/packages/Logging/iScriptDebug.js"
	#include "../script/STL/packages/Logging/StatsObject.js"
	#include "../script/STL/packages/Logging/Stopwatch.js"
#endif


// Script Configuration
var LOG_TO_FILE =			true	// false - log to stdout if ran by intool, true - log to inserverXX/log/ directory
var SPLIT_LOG_BY_THREAD =	false	// set to true in high volume scripts when multiple worker threads are used (workflow, external message agent, etc)
var MAX_LOG_FILE_SIZE =		100		// Maximum size of log file (in MB) before a new one will be created

var EXECUTION_METHODS =		["INTOOL"];	//Allowed script execution methods: WORKFLOW, INTOOL, TASK, EFORM, EMA

// IMPORTANT: SET THESE VARIABLES BEFORE RUNNING THE SCRIPT
var TEST_MODE = true;	// NO write operations will occur when TEST_MODE = true (logs will indicate what would happen instead)
var DEBUG_LEVEL = 5;	// Standard iScriptDebug log level (5 = DEBUG, most verbose, 1 = CRITICAL, least verbose)


// Array of document types to be modified
var docTypesToModify = ['OIT_Test Document Type'];

// Array of custom properties to remove
var customPropsToRemove = [
	'OIT_OldDocID',
];

//Global Variables
var debug = null;
var stats = null;
var timer = null;

function main ()
{
	try
	{
		// Initialize
		debug = new iScriptDebug("USE SCRIPT FILE NAME", LOG_TO_FILE, DEBUG_LEVEL, undefined, { splitLogByThreadID: SPLIT_LOG_BY_THREAD, maxLogFileSize: MAX_LOG_FILE_SIZE });
		debug.showINowInfo("INFO");
		debug.log("INFO", "Script Name: %s\n", _argv[0]);

		if (TEST_MODE) {
			printf("\nTEST MODE: No write operations will occur.\n\n");
			debug.logln("NOTIFY", "TEST MODE: No write operations will occur.");
		}

		// Initialize stats object
		stats = new StatsObject();

		// Initialize timer object
		timer = new Stopwatch();

		// Check script execution
		if (!debug.checkExecution(EXECUTION_METHODS)) {
			debug.logln("CRITICAL", "This iScript is running as [%s] and is designed to run from [%s]", debug.getExecutionMethod(), EXECUTION_METHODS);
			throw "Execution method mismatch!"
		}

		debug.logln("NOTIFY", "Beginning INTool script.");

		debug.log("INFO", "Document Types to be modified:\n");
		debug.logObject("INFO", docTypesToModify, 5);

		debug.log("INFO", "Custom Properties to be removed:\n");
		debug.logObject("INFO", customPropsToRemove, 5);

		if (!validateInputs()) {
			printf("CRITICAL: One or more inputs failed to validate. Review the log for further details.\n");
			return;
		}

		for (dt=0; dt < docTypesToModify.length; dt++) {
			var docType = docTypesToModify[dt];
			debug.log("DEBUG", "Currently processing document type: [%s]\n", docType.name);

			//Merge props here
			var mergedProps = mergeProperties(docType);

			if(!mergedProps) {
				stats.inc("Document Types Not Needing Changes");
				debug.log("WARNING", "No properties need to be removed from document type [%s], skipping update operation.\n", docType.name);
				continue;
			}

			// Update the document type
			if (!TEST_MODE) {
				if (!docType.update(
						docType.name, docType.desc,
						docType.isActive, docType.sigVerifyInterval,
						docType.wsTemplId, mergedProps)) {
					stats.inc("Errors updating document types");
					debug.log("ERROR", "Unable to update document type [%s].\n", docType.name);
					debug.log("ERROR", "Detailed error message: %s.\n", getErrMsg());
				} else {
					stats.inc("Document Types Updated");
					debug.log("INFO", "The document type [%s] has been updated.\n", docType.name);
				}
			} else {
				stats.inc("TEST_MODE: Document Types (that would have been) Updated");
				debug.log("INFO", "TEST_MODE: The script would have removed the previously logged custom properties from document type [%s].\n", docType.name);
			}
		}

		// Retrieve and print the batch counts, as well as script execution time
		var sortedStats = stats.getSortedStats();

		printf("Results:\n");
		printf("%s\n", sortedStats);

		debug.log("INFO", "\n\nResults:\n%s\n", sortedStats);

		debug.logln("NOTIFY", "Ending INTool script.");

	}
	catch(e)
	{
		if(!debug)
		{
			printf("\n\nFATAL iSCRIPT ERROR: %s\n\n", e.toString());
		}
        else
        {
            debug.setIndent(0);
            debug.logln("CRITICAL", "Fatal iScript Error: %s", e.toString());

			if (DEBUG_LEVEL < 3 && typeof(debug.getLogHistory) === "function")
            {
                debug.popLogHistory(11);
                debug.log("CRITICAL", "Log History:\n\n%s\n\n", debug.getLogHistory());
            }
        }
	}

	finally
	{
		if (debug) debug.finish();
	}
}

// Validate the user-provided inputs
// @returns bool
function validateInputs() {
	// Validate the custom properties to be removed
	for (cp=0; cp < customPropsToRemove.length; cp++) {
		var prop = INProperty.getByName(customPropsToRemove[cp]);

		if (!prop) {
			debug.log("CRITICAL", "Property not found: [%s]\n", customPropsToRemove[cp]);
			return false;
		} else {
			debug.log("DEBUG", "Property found: [%s]\n", customPropsToRemove[cp]);
			debug.logObject("DEBUG", prop, 5);
		}
	}

	// Validate the document types to be modified
	for (dt=0; dt < docTypesToModify.length; dt++) {
		var docType = INDocType.get(docTypesToModify[dt]);

		if (!docType) {
			debug.log("CRITICAL", "Document Type not found: [%s]\n", docTypesToModify[dt]);
			return false;
		} else {
			debug.log("DEBUG", "Document Type found: [%s]\n", docTypesToModify[dt]);
			debug.logObject("DEBUG", docType, 5);

			// Save the retrieved property back to the array for later use
			docTypesToModify[dt] = docType;
		}
	}

	// If we got this far, all custom properties and document types
	// were found, so all inputs have been validated successfully.
	return true;
}

function mergeProperties(docType) {
	if(docType.props.length > 0) {
		var mergedProps = new Array();

		// Iterate over all of the document properties and see
		// if they match any of the custom properties to be added.
		// If so, output a warning to the logs.
		for (dp=0; dp < docType.props.length; dp++) {
			var cpExistsOnDocType = false;

			for (cp=0; cp < customPropsToRemove.length; cp++) {
				if (customPropsToRemove[cp] == docType.props[dp].name) {
					cpExistsOnDocType = true;
					break;
				}
			}

			if (cpExistsOnDocType) {
				debug.logln("DEBUG", "The custom property [%s] exists on document type [%s]. The custom property will be removed by this script.", customPropsToRemove[cp], docType.name);
			} else {
				debug.logln("DEBUG", "The current document property [%s] does not match a property marked for removal. The custom property will remain attached.", docType.props[dp].name);
				mergedProps.push(docType.props[dp]);
			}
		}

		if (mergedProps.length == docType.props.length) {
			//No props to be removed, returning false
			return false;
		} else {
			debug.log("DEBUG", "Merged Props:\n");
			debug.logObject(5, mergedProps, 5);
			debug.log("DEBUG", "\n");

			return mergedProps;
		}
	} else {
		debug.logln("DEBUG", "No existing properties on the document type. No operations will be performed.");
		return false;
	}
}
//-- last line must be a comment --
