import fs from 'fs';

import YAML from 'yaml';
import * as Yup from 'yup';

import { AndroidAgentConfig } from './agents/android/AndroidAgentConfig';
import { AgentType, AgentConfig } from './agents/types';
import { IosAgentConfig } from './agents/ios/IosAgentConfig';

const schema = Yup.object().shape({
	port: Yup.number()
		.min(1, 'Must be valid port number')
		.max(65535, 'Must be valid port number')
		.default(8700),
	agents: Yup.array()
		.of(
			Yup.object().shape({
				type: Yup.string().oneOf(['android', 'ios', 'web']).required(),
				output: Yup.string().required(),
				startAppCommand: Yup.string().required(),
				startAppTimeout: Yup.number().min(1).required(),

				// android only
				paths: Yup.object().when(
					'type',
					(type: string, schema: any) => {
						if (type == 'android') {
							return schema
								.shape({
									adb: Yup.string().required(),
									emulator: Yup.string().required(),
									sdkManager: Yup.string().required(),
									avdManager: Yup.string().required()
								})
								.required();
						} else {
							return schema.oneOf([undefined]);
						}
					}
				),
				clearNotifications: Yup.boolean().when(
					'type',
					(type: string, schema: any) => {
						if (type == 'android') {
							return schema.default(false);
						} else {
							return schema.oneOf([undefined]);
						}
					}
				),

				// android + ios only
				devices: Yup.array()
					.of(
						Yup.string()
							.matches(/[a-zA-Z0-9._-]+;[a-zA-Z0-9._-]+/)
							.required()
					)
					.when('type', (type: string, schema: any) => {
						if (['android', 'ios'].includes(type)) {
							return schema.ensure();
						} else {
							return schema.oneOf([undefined]);
						}
					}),
				time: Yup.number()
					.min(0)
					.when('type', (type: string, schema: any) => {
						if (['android', 'ios'].includes(type)) {
							return schema.nullable().default(null);
						} else {
							return schema.oneOf([undefined]);
						}
					}),

				// web only
				url: Yup.string()
					.url()
					.when('type', (type: string, schema: any) => {
						if (type == 'web') {
							return schema.required();
						} else {
							return schema.oneOf([undefined]);
						}
					}),
				screenSizes: Yup.array()
					.of(
						Yup.string()
							.matches(/^[0-9]+x[0-9]+$/)
							.required()
					)
					.when('type', (type: string, schema: any) => {
						if (type == 'web') {
							return schema.ensure();
						} else {
							return schema.oneOf([undefined]);
						}
					})
			})
		)
		.ensure()
});

class Config {
	configContents: Record<string, number | any[]> = {};
	port = 6000;
	agents: (AgentConfig | AndroidAgentConfig | IosAgentConfig)[] = [];

	constructor(file: string) {
		const fileContents = fs.readFileSync(file, 'utf-8');

		let config = null;

		if (/.(?:yml|yaml)$/.exec(file)) {
			config = YAML.parse(fileContents);
		}

		if (/.(?:json)$/.exec(file)) {
			config = JSON.parse(fileContents);
		}

		if (config == null) {
			throw new Error(
				'Unsupported config file format. Please use json or yml'
			);
		}

		this.configContents = config;
	}

	validate(): Promise<Config> {
		return schema.validate(this.configContents).then(config => {
			this.port = config.port;
			this.agents = config.agents
				.map(agentConfig => {
					switch (agentConfig.type) {
						case 'android': {
							const config: AndroidAgentConfig = {
								type: AgentType.android,
								output: agentConfig.output,
								startAppCommand: agentConfig.startAppCommand,
								startAppTimeout: agentConfig.startAppTimeout,
								paths: {
									adb: agentConfig.paths.adb,
									emulator: agentConfig.paths.emulator,
									sdkManager: agentConfig.paths.sdkManager,
									avdManager: agentConfig.paths.avdManager
								},
								devices: agentConfig.devices || [],
								time: agentConfig.time,
								clearNotifications:
									agentConfig.clearNotifications
							};

							return config;
						}
						case 'ios': {
							const config: IosAgentConfig = {
								type: AgentType.ios,
								output: agentConfig.output,
								startAppCommand: agentConfig.startAppCommand,
								startAppTimeout: agentConfig.startAppTimeout,
								devices: agentConfig.devices || [],
								time: agentConfig.time
							};

							return config;
						}
						default:
							return null;
					}
				})
				.reduce((acc: AgentConfig[], cur: AgentConfig | null) => {
					if (cur != null) {
						return [...acc, cur];
					}
					return acc;
				}, []);

			return this;
		});
	}
}

export default Config;
