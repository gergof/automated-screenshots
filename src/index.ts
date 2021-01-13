#!/usr/bin/env node
import { program } from 'commander';
import chalk from 'chalk';

import Config from './Config';
import AndroidAgent from './agents/android/AndroidAgent';
import { AndroidAgentConfig } from './agents/android/AndroidAgentConfig';
import BaseAgent from './agents/BaseAgent';
import { AgentType } from './agents/types';
import IosAgent from './agents/ios/IosAgent';
import { IosAgentConfig } from './agents/ios/IosAgentConfig';
import DummyAgent from './agents/dummy/DummyAgent';

program
	.version('@VERSION@', '-v, --version')
	.description('Take automated screenshots using different agents')
	.requiredOption('-c, --config <file>', 'configuration file in json or yml')
	.option(
		'-a, --agents <agent types...>',
		'only run the specified agent types'
	);

program.parse(process.argv);

if (process.config) {
	const config = new Config(program.config);

	config
		.validate()
		.then(config => {
			config.agents
				.filter(agent => {
					if (program.agents) {
						return (<string[]>program.agents).includes(agent.type);
					}

					return true;
				})
				.reduce((p: Promise<void>, agentConfig) => {
					return p.then(() => {
						let agent: BaseAgent | null = null;

						switch (agentConfig.type) {
							case AgentType.android:
								agent = new AndroidAgent(
									<AndroidAgentConfig>agentConfig,
									config.port
								);
								break;
							case AgentType.ios:
								agent = new IosAgent(
									<IosAgentConfig>agentConfig,
									config.port
								);
								break;
							case AgentType.dummy:
								agent = new DummyAgent(
									agentConfig,
									config.port
								);
								break;
							default:
								agent = null;
						}

						if (!agent) {
							console.log(
								chalk.red.bold('[ERROR]'),
								'Failed to initialize agent'
							);
							return Promise.resolve();
						}

						console.log(
							chalk.blue.bold('[INFO ]'),
							'Starting agent:',
							agent.agentName
						);

						return agent
							.boot()
							.then(agent => agent.takeScreenshots())
							.then(agent => agent.halt())
							.then(() => {})
							.catch(e => {
								console.log(
									chalk.red.bold('[ERROR]'),
									'Error during the execution of agent:',
									e.message
								);
							});
					});
				}, Promise.resolve())
				.then(() => {
					console.log(
						chalk.green.bold('[DONE ]'),
						'Finished taking screenshots'
					);
				});
		})
		.catch(e => {
			console.log(
				chalk.red.bold('[ERROR]'),
				'Failed to parse config:',
				e.message
			);
		});
}
