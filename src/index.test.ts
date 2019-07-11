import config from '.'
const yaml = require('js-yaml')

it('dumps correctly', () => {
  config
    .docker('circleci/node:10.3.0', {
      environment: {
        TZ: '/usr/share/zoneinfo/Asia/Tokyo',
      },
    })
    .docker('postgres', {
      environment: {
        TZ: '/usr/share/zoneinfo/Africa/Abidjan',
      },
    })

  const tslint = 'yarn tslint --write **/*.ts'

  // prettier-ignore
  config
    .define('graphdoc')
    .usePackage('yarn')
    .tasks`
      yarn graphdoc
      yarn extremely long task but this will not be multiple lines because line length limit is disabled
    `

  // prettier-ignore
  config
    .define('test')
    .usePackage('yarn')
    .branches('develop')
    .docker('nats')
    .tasks`
      yarn test
      ${tslint}
    `

  // prettier-ignore
  config
    .define('deploy')
    .usePackage('yarn')
    .branches('beta', 'master')
    .requires('test')
    .tasks`
      yarn deploy
    `

  // prettier-ignore
  config
    .define('publish')
    .usePackage('yarn')
    .branches('release')
    .requires('test', 'deploy')
    .tasks`
      yarn publish
    `

  expect(config.toConfig()).toEqual(yaml.safeLoad`
    version: 2
    jobs:
      graphdoc:
        docker:
          - image: 'circleci/node:10.3.0'
            environment:
              TZ: /usr/share/zoneinfo/Asia/Tokyo
          - image: 'postgres'
            environment:
              TZ: /usr/share/zoneinfo/Africa/Abidjan
        working_directory: ~/repo
        steps:
          - checkout
          - restore_cache:
              keys:
                - 'v2-dependencies-{{ checksum "yarn.lock" }}'
                - v2-dependencies-
          - run: yarn install
          - save_cache:
              paths:
                - node_modules
              key: 'v2-dependencies-{{ checksum "yarn.lock" }}'
          - run: yarn graphdoc
          - run: yarn extremely long task but this will not be multiple lines because line length limit is disabled
      test:
        docker:
          - image: 'circleci/node:10.3.0'
            environment:
              TZ: /usr/share/zoneinfo/Asia/Tokyo
          - image: 'postgres'
            environment:
              TZ: /usr/share/zoneinfo/Africa/Abidjan
          - image: nats
        working_directory: ~/repo
        steps:
          - checkout
          - restore_cache:
              keys:
                - 'v2-dependencies-{{ checksum "yarn.lock" }}'
                - v2-dependencies-
          - run: yarn install
          - save_cache:
              paths:
                - node_modules
              key: 'v2-dependencies-{{ checksum "yarn.lock" }}'
          - run: yarn test
          - run: yarn tslint --write **/*.ts
      deploy:
        docker:
          - image: 'circleci/node:10.3.0'
            environment:
              TZ: /usr/share/zoneinfo/Asia/Tokyo
          - image: 'postgres'
            environment:
              TZ: /usr/share/zoneinfo/Africa/Abidjan
        working_directory: ~/repo
        steps:
          - checkout
          - restore_cache:
              keys:
                - 'v2-dependencies-{{ checksum "yarn.lock" }}'
                - v2-dependencies-
          - run: yarn install
          - save_cache:
              paths:
                - node_modules
              key: 'v2-dependencies-{{ checksum "yarn.lock" }}'
          - run: yarn deploy
      publish:
        docker:
          - image: 'circleci/node:10.3.0'
            environment:
              TZ: /usr/share/zoneinfo/Asia/Tokyo
          - image: 'postgres'
            environment:
              TZ: /usr/share/zoneinfo/Africa/Abidjan
        working_directory: ~/repo
        steps:
          - checkout
          - restore_cache:
              keys:
                - 'v2-dependencies-{{ checksum "yarn.lock" }}'
                - v2-dependencies-
          - run: yarn install
          - save_cache:
              paths:
                - node_modules
              key: 'v2-dependencies-{{ checksum "yarn.lock" }}'
          - run: yarn publish
    workflows:
      version: 2
      master_jobs:
        jobs:
          - graphdoc
          - test:
              filters:
                branches:
                  only:
                    - develop
          - deploy:
              requires:
                - test
              filters:
                branches:
                  only:
                    - beta
                    - master
          - publish:
              requires:
                - test
                - deploy
              filters:
                branches:
                  only:
                    - release
      `)
})
