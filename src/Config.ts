import convict from 'convict';
import YAML from 'yaml';

import BaseAgent from './agents/BaseAgent';

convict.addFormat({
	name: 'array-of',
	validate: (sources: any, schema: any): void => {
		if (!Array.isArray(sources)) {
			throw new Error('must be of type Array');
		}

		for (const source of sources) {
			convict(schema.children).load(source).validate();
		}
	}
});

convict.addParser({ estension: ['yml', 'yaml'], parser: YAML.parse });

class Config {
	port = 6000;
	agents: BaseAgent[] = [];

	constructor(file: string) {
		const config = convict({
			port: {
				doc:
					'Port to open the ws server on (used for communication with the clients',
				format: 'port',
				default: 6000
			},
			agents: {
				doc: 'Agents which will take the screenshots',
				format: 'array-of',
				default: [],
				children: {
					type: {
						doc: 'Type of parser',
						format: ['android', 'ios', 'web'],
						default: null
					},
					output: {
						doc: 'Output folder for screenshots',
						format: String,
						default: null
					},
					startAppCommand: {
						doc: 'Command to start the app with',
						format: String,
						default: null
					},
					startAppTimeout: {
						doc:
							'If the app fails to start within this timeout the agent will fail',
						format: 'int',
						default: null
					},

					// android agent:
					paths: {
						adb: {
							doc: 'Path to ADB executable',
							format: String,
							default: null
						},
						emulator: {
							doc: 'Path to emulator executable',
							format: String,
							default: null
						},
						sdkManager: {
							doc: 'Path to sdkmanager executable',
							format: String,
							default: null
						},
						avdManager: {
							doc: 'Path to avdmanager executable',
							format: String,
							default: null
						}
					},
					clearNotifications: {
						doc:
							'Set to true to clear notifications before taking a screenshot',
						format: Boolean,
						default: false
					},

					// android + ios agent:
					devices: {
						doc: 'Devices to take screenshots on',
						format: 'array-of',
						default: [],
						children: String
					},
					time: {
						doc: 'Unix timestamp to set the clock to',
						format: 'int',
						default: 0
					},

					// web agent:
					url: {
						doc: 'The URL to open in the browser',
						format: String,
						default: null
					},
					screenSizes: {
						doc:
							'Screen sizes to take screenshots on defined as WIDTHxHEIGHT (ex: 1920x1080)',
						format: 'array-of',
						default: [],
						children: String
					}
				}
			}
		});

		config.loadFile(file);

		this.port = config.port;
	}
}

export default Config;
