import path from 'path';
import fs from 'fs';

import filenamify from 'filenamify';
import moment from 'moment';

import BaseAgent from '../BaseAgent';
import Screenshot from '../../Screenshot';

import { IosAgentConfig } from './IosAgentConfig';

class IosAgent extends BaseAgent {
	config: IosAgentConfig;
	screenshotFolder: string | null = null;
	simulatorName = 'automatedscreenshots-device';
	simulatorUuid = '';

	constructor(config: IosAgentConfig, port: number) {
		super(config, port);
		this.config = config;
		this.agentName = 'IosAgent';
	}

	boot(): Promise<IosAgent> {
		this.log('info', 'Agent booted');

		return Promise.resolve(this);
	}

	takeScreenshots(): Promise<IosAgent> {
		return this.config.devices
			.reduce((p: Promise<void>, device: string) => {
				return p.then(() => this.screenshotForDevice(device));
			}, Promise.resolve())
			.then(() => this);
	}

	halt(): Promise<IosAgent> {
		this.log('done', 'Agent finished');

		return Promise.resolve(this);
	}

	private screenshotForDevice(device: string): Promise<void> {
		this.screenshotFolder = filenamify.path(
			path.resolve(process.cwd(), this.config.output, device),
			{ replacement: '_' }
		);

		return this.startDevice(device)
			.then(() => this.capturePack())
			.then(() => this.stopDevice(device));
	}

	private startDevice(device: string): Promise<void> {
		const dev = device.split(';')[0];
		const ios = device.split(';')[1];

		this.log('info', 'Starting simulator for:', device);

		return this.cmdExecOutput('xcrun', [
			'simctl',
			'create',
			this.simulatorName,
			dev,
			ios
		])
			.then(uuid => {
				this.simulatorUuid = uuid.trim();
				this.log('info', 'Created simulator:', this.simulatorUuid);

				return this.cmdExec('xcrun', [
					'simctl',
					'boot',
					this.simulatorUuid
				]);
			})
			.then(() => new Promise(resolve => setTimeout(resolve, 45000)))
			.then(() => this.startApp())
			.then(() => this.connectToClient())
			.then(() => {});
	}

	private stopDevice(device: string): Promise<void> {
		this.log('info', 'Stopping simulator for:', device);

		return this.stopClientManager()
			.then(() =>
				this.cmdExec('xcrun', [
					'simctl',
					'shutdown',
					this.simulatorUuid
				])
			)
			.then(() =>
				this.cmdExec('xcrun', ['simctl', 'delete', this.simulatorUuid])
			)
			.then(() => {});
	}

	protected async takeScreenshot(screenshot: Screenshot): Promise<void> {
		if (this.config.time) {
			const iosTime = moment(this.config.time * 1000).format(
				'YYYY-MM-DDTHH:mm:ss+00:00'
			);
			await this.cmdExec('xcrun', [
				'simctl',
				'status_bar',
				this.simulatorUuid,
				'override',
				'--time',
				`"${iosTime}"`
			]);
		}

		// take screenshot
		const folder = filenamify.path(
			path.join(
				this.screenshotFolder || process.cwd(),
				screenshot.suite.name
			),
			{ replacement: '_' }
		);
		fs.mkdirSync(folder, { recursive: true });
		await this.cmdExec('xcrun', [
			'simctl',
			'io',
			this.simulatorUuid,
			'screenshot',
			`"${path.resolve(
				folder,
				filenamify(screenshot.name, { replacement: '_' }) + '.png'
			)}"`
		]);

		return;
	}

	protected executeCommand(): Promise<void> {
		// we can't do anything from simctl :(
		return Promise.resolve();
	}
}

export default IosAgent;
