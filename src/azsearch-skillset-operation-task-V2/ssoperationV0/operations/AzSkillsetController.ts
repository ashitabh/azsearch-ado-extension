import * as tl from 'azure-pipelines-task-lib/task';
import * as path from 'path';
import * as fs from 'fs';
import { UrlBasedRequestPrepareOptions } from 'ms-rest';
import { SkillsetOperationTaskParameters } from '../azure-devops-models';
import {
  AZSEARCH_DATAAPI_VERSION,
  AzureSearchClient,
  SkillsetOptions
} from '../../../common';

export class azSkillsetController {
  private taskParameters: SkillsetOperationTaskParameters;
  public asClient: AzureSearchClient;
  private ssOptions: SkillsetOptions;

  constructor(taskParameters: SkillsetOperationTaskParameters) {
    this.taskParameters = taskParameters;
    this.asClient = new AzureSearchClient();

    this.ssOptions = {
      subscriptionId: this.taskParameters.subscriptionId,
      azsearchName: this.taskParameters.azsearchName,
      resourceGroup: this.taskParameters.resourceGroupName,
      payloadPath:
        this.taskParameters.jsonPayloadLocation == 'filePath'
          ? this.taskParameters.jsonPayloadPath
          : null,
      payload: this.taskParameters.inlineJsonPayload,
      skillsetName: this.taskParameters.skillsetName
    };
  }

  public addUpdateDeleteSkillset(): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      try {
        if (this.ssOptions.payloadPath) {
          this.ssOptions.payload = fs.readFileSync(
            this.ssOptions.payloadPath,
            'utf8'
          );
        }

        let options: UrlBasedRequestPrepareOptions = {
          method: 'PUT',
          url: `https://${this.ssOptions.azsearchName}.search.windows.net/skillsets/${this.ssOptions.skillsetName}?api-version=${AZSEARCH_DATAAPI_VERSION}`,
          serializationMapper: null,
          deserializationMapper: null,
          headers: {
            'Content-Type': 'application/json',
            'api-key': `${this.asClient.azureSearchAdminKey}`
          },
          body: this.ssOptions.payload,
          disableJsonStringifyOnBody: true
        };

        let request = await this.asClient.azureClient.sendRequest(
          options,
          (err, result: any, request, response) => {
            //let opsList: SkillsetOpResult[] = result.value;
            if (err) {
              tl.debug(tl.loc('AzureRESTRequestError', err.message));
              reject(tl.loc('AzureRESTRequestError', err.message));
            } else if (
              response.statusCode == 201 ||
              response.statusCode == 204
            ) {
              console.log(
                tl.loc(
                  'AzureSearchSkillsetSuccess',
                  this.ssOptions.azsearchName
                )
              );
              //resolve(opsList);
            } else if (response.statusCode == 207) {
              console.log(
                tl.loc(
                  'AzureSearchSkillsetWarning',
                  this.ssOptions.azsearchName
                )
              );
              //resolve(opsList);
            } else if (response.statusCode == 429) {
              console.log(
                tl.loc(
                  'AzureSearchSkillsetQuotaExceeded',
                  this.ssOptions.azsearchName
                )
              );
              //resolve(opsList);
            } else {
              tl.debug(tl.loc('AzureSearchBadRequest', result.error.message));
              reject(tl.loc('AzureSearchBadRequest', result.error.message));
            }
          }
        );
      } catch (error) {
        reject(error);
      }
    });
  }
}
