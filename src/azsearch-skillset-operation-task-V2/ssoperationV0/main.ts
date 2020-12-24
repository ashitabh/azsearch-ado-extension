import * as tl from 'azure-pipelines-task-lib/task';
import * as path from 'path';
import * as az from '../../common';

import { SkillsetOperationTaskParameters } from './azure-devops-models';
import { azSkillsetController } from './operations';

async function run(): Promise<void> {
  try {
    let taskManifestPath = path.join(__dirname, '../../../task.json');
    tl.debug(`Setting resource path to ${taskManifestPath}`);
    tl.setResourcePath(taskManifestPath);

    let ssParameters = new SkillsetOperationTaskParameters();
    let taskParameters = await ssParameters.getSkillsetOperationTaskParameters();

    let ssController = new azSkillsetController(taskParameters);
    let operationOutput: any;

    // Authenticate on Azure REST Api
    ssController.asClient = await az.setupAzure(
      taskParameters.clientId,
      taskParameters.clientSecret,
      taskParameters.tenantId,
      taskParameters.subscriptionId,
      taskParameters.resourceGroupName,
      taskParameters.azsearchName
    );

    // Skillset Operation Task
    console.log(
      tl.loc('AzureSearchOperationExec', taskParameters.SkillsetOperation)
    );
    switch (taskParameters.SkillsetOperation) {
      case 'AddUpdateDeleteSkillset':
        operationOutput = await ssController.addUpdateDeleteSkillset();
        break;
      case 'SearchSkillset':
        //operationOutput = await ssController.searchSkillset();
        break;
      case 'CountSkillsets':
        //operationOutput = await ssController.countSkillsets();
        break;
    }

    // Set output variable
    let operationOutputString: string = operationOutput
      ? JSON.stringify(operationOutput)
      : 'No Output';
    console.log(tl.loc('SkillsetOptionOutput', operationOutputString));
    tl.setVariable('SkillsetOptionOutput', operationOutputString);

    tl.setResult(tl.TaskResult.Succeeded, '');
  } catch (error) {
    tl.setResult(tl.TaskResult.Failed, error);
  }
}

run();
