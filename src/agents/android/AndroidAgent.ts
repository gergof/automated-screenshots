import BaseAgent from '../BaseAgent';
import { AndroidAgentConfig } from './AndroidAgentConfig';
import Screenshot from '../../Screenshot';
import { ChildProcess } from 'child_process';
import kill from 'tree-kill';
import moment from 'moment';
import fs from 'fs';
import path from 'path';
import filenamify from 'filenamify';

class AndroidAgent extends BaseAgent {
	config: AndroidAgentConfig;
	emulatorName = 'automatedscreenshots-device';
	emulatorProcess: ChildProcess | null = null;
	screenshotFolder: string | null = null;

	constructor(config: AndroidAgentConfig, port: number) {
		super(config, port);
		this.config = config;
		this.agentName = 'AndroidAgent';
	}

	boot(): Promise<AndroidAgent> {
		return new Promise((resolve, reject) => {
			// install required sdk tools
			const platforms = this.config.devices.reduce(
				(acc: string[], cur: string) => {
					const apiVersion = cur.split(';')[1];
					return [
						...acc,
						`"platforms;android-${apiVersion}"`,
						`"system-images;android-${apiVersion};google_apis;x86"`
					];
				},
				[]
			);

			this.log('info', 'Install required platforms and accept licenses');

			this.cmdExec(this.config.paths.sdkManager, platforms, true)
				.then(code => {
					if (code) {
						this.log(
							'error',
							'Failed to install required platforms:',
							platforms.join(', ')
						);

						throw new Error('Failed to boot');
					}

					return this.cmdExec(
						this.config.paths.sdkManager,
						['--licenses'],
						true
					);
				})
				.then(code => {
					if (code) {
						this.log('error', 'Failed to accept licenses');

						throw new Error('Failed to boot');
					}
				})
				.then(() => {
					this.log('info', 'Agent booted');
					resolve(this);
				})
				.catch(e => {
					reject(e);
				});
		});
	}

	takeScreenshots(): Promise<AndroidAgent> {
		return this.config.devices
			.reduce((p: Promise<void>, device: string) => {
				return p.then(() => this.screenshotForDevice(device));
			}, Promise.resolve())
			.then(() => this);
	}

	halt(): Promise<AndroidAgent> {
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
		const dev: string = device.split(';')[0];
		const api: string = device.split(';')[1];

		this.log('info', 'Starting emulator for:', device);

		return this.cmdExec(this.config.paths.avdManager, [
			'create',
			'avd',
			'--force',
			'--name',
			this.emulatorName,
			'--device',
			dev,
			'--package',
			`"system-images;android-${api};google_apis;x86"`,
			'--abi',
			'x86'
		])
			.then(code => {
				if (code) {
					this.log('error', 'Failed to create emulator');
					throw new Error('Failed to create emulator');
				}

				this.emulatorProcess = this.cmdSpawn(
					this.config.paths.emulator,
					['-avd', this.emulatorName]
				);

				return Promise.resolve();
			})
			.then(() => new Promise(resolve => setTimeout(resolve, 30000)))
			.then(() =>
				this.cmdExec(this.config.paths.adb, [
					'reverse',
					`tcp:${this.port}`,
					`tcp:${this.port}`
				])
			)
			.then(() =>
				this.cmdExec(this.config.paths.adb, [
					'shell',
					'pm',
					'disable-user',
					'--user',
					'0',
					'com.google.android.setupwizard'
				])
			)
			.then(() => this.startApp())
			.then(() => this.connectToClient())
			.then(() => {});
	}

	private stopDevice(device: string): Promise<void> {
		this.log('info', 'Stopping emulator for:', device);

		return this.stopClientManager()
			.then(() => {
				return new Promise<void>(resolve => {
					if (!this.emulatorProcess) {
						resolve();
						return;
					}

					kill(this.emulatorProcess.pid, 'SIGINT');
					this.emulatorProcess = null;
					setTimeout(resolve, 5000);
				});
			})
			.then(() =>
				this.cmdExec(this.config.paths.avdManager, [
					'delete',
					'avd',
					'--name',
					this.emulatorName
				])
			)
			.then(() => {});
	}

	protected async takeScreenshot(screenshot: Screenshot): Promise<void> {
		if (this.config.time) {
			const androidTime: string = moment(this.config.time * 1000).format(
				'MMDDhhmmYYYY.ss'
			);
			await this.cmdExec(this.config.paths.adb, [
				'shell',
				'su',
				'0',
				'date',
				androidTime
			]);
		}

		if (this.config.clearNotifications) {
			await this.cmdExec(this.config.paths.adb, [
				'shell',
				'service',
				'call',
				'notification',
				'1'
			]);
		}

		// hide keyboard
		await this.cmdExec(this.config.paths.adb, [
			'shell',
			'input',
			'keyevent',
			'111'
		]);

		await new Promise(resolve => setTimeout(resolve, 1000));

		// take screenshot
		const folder = filenamify.path(
			path.join(
				this.screenshotFolder || process.cwd(),
				screenshot.suite.name
			),
			{ replacement: '_' }
		);
		fs.mkdirSync(folder, { recursive: true });
		await this.cmdExec(this.config.paths.adb, [
			'shell',
			'screencap',
			'-p',
			'"/sdcard/automatedscreenshots.png"'
		]);
		await this.cmdExec(this.config.paths.adb, [
			'pull',
			'"/sdcard/automatedscreenshots.png"',
			`"${path.resolve(
				folder,
				filenamify(screenshot.name, { replacement: '_' }) + '.png'
			)}"`
		]);
		await this.cmdExec(this.config.paths.adb, [
			'shell',
			'rm',
			'"/sdcard/automatedscreenshots.png"'
		]);

		return;
	}
}

export default AndroidAgent;
