import { config, defaultConfig } from '../../config/'
import Server from '../../src/server'

export default function createServer() {
    return new Server(config, defaultConfig)
}