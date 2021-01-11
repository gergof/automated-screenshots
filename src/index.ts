import { program } from 'commander';
import info from '../package.json';
import Config from './Config';
import chalk from 'chalk';
import AndroidAgent from './agents/android/AndroidAgent';
import { AndroidAgentConfig } from './agents/android/AndroidAgentConfig';

program
	.version(info.version, '-v, --version')
	.description('Take automated screenshots using different agents')
	.requiredOption('-c, --config <file>', 'configuration file in json or yml');

program.parse(process.argv);

if (process.config) {
	const config = new Config(program.config);

	config
		.validate()
		.then(config => {
			const agent = new AndroidAgent(
				<AndroidAgentConfig>config.agents[0],
				config.port
			);
			agent.boot().then(() => agent.takeScreenshots());
		})
		.catch(e => {
			console.log(
				chalk.red.bold('[ERROR]'),
				'Failed to parse config:',
				e.message
			);
		});
}
