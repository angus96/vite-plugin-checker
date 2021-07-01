import {
  getHmrOverlayText,
  killServer,
  preTest,
  viteBuild,
  viteServe,
} from '../../../packages/vite-plugin-checker/__tests__/e2e/Sandbox/Sandbox'
import {
  editFile,
  sleep,
  testDir,
  WORKER_CLEAN_TIMEOUT,
} from '../../../packages/vite-plugin-checker/__tests__/e2e/testUtils'

beforeAll(async () => {
  await preTest()
})

afterAll(async () => {
  await sleep(WORKER_CLEAN_TIMEOUT)
})

describe('vue2-vls', () => {
  describe('serve', () => {
    it('get initial error and subsequent error', async () => {
      await viteServe({ cwd: testDir, port: 8080, path: '/vue-template/' })
      await sleep(3000)

      // const [message1, file1] = await getHmrOverlayText()
      await sleep(1000)
      // TODO: vls checker missed initial error overlay 😅
      // expect(message1).toContain('> 3 |     <h1>{{ msg1 }}</h1>')
      // expect(message1).toContain(
      //   `Property 'msg1' does not exist on type 'CombinedVueInstance<{ msg: string; } & Vue, object, object, object, Record<never, any>>'. Did you mean 'msg'?`
      // )
      // expect(file1).toContain('vue2-vls/src/components/HelloWorld.vue:3:12')

      editFile('src/components/HelloWorld.vue', (code) => code.replace('msg1', 'msg2'))
      await sleep(1000)
      const [message2] = await getHmrOverlayText()
      expect(message2).toContain(`> 3 |     <h1>{{ msg2 }}</h1>`)

      await killServer()
    })
  })

  describe('build', () => {
    it('enableBuild: true', async () => {
      await viteBuild({
        expectedErrorMsg: `Property 'msg2' does not exist on type`,
        cwd: testDir,
      })
    })

    it('enableBuild: false', async () => {
      editFile('vite.config.ts', (code) =>
        code.replace(
          'Checker({ vls: VlsChecker() })',
          'Checker({ vls: VlsChecker(), enableBuild: false })'
        )
      )
      await viteBuild({
        unexpectedErrorMsg: `Property 'msg1' does not exist on type`,
        cwd: testDir,
      })
    })
  })
})
