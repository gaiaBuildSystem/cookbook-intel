#!/usr/bin/env -S deno run --allow-all

import process from "node:process"
import PATH from "node:path"
import FS from "node:fs"
import { execSync } from "node:child_process"
import logger from "node-color-log"
import { Recipe } from "../../../../gaia/scripts/bitcook/parse.ts"
import { getAssetPath } from "../../../../gaia/scripts/bitcook/utils/getAssetPath.ts"

// gaia need to previously set arhitecture and machine
const MACHINE = process.env.MACHINE as string
const BUILD_PATH = process.env.BUILD_PATH as string
const INITRAMFS_PATH = process.env.INITRAMFS_PATH as string
const META = JSON.parse(process.env.META as string) as Recipe

// get the actual script path, not the process.cwd
const _path = PATH.dirname(process.argv[1])
const _paths = META.paths
process.env.ORIGIN_PATH = _path

const IMAGE_MNT_BOOT = `${BUILD_PATH}/tmp/${MACHINE}/mnt/boot`
const IMAGE_MNT_ROOT = `${BUILD_PATH}/tmp/${MACHINE}/mnt/root`
process.env.IMAGE_MNT_BOOT = IMAGE_MNT_BOOT
process.env.IMAGE_MNT_ROOT = IMAGE_MNT_ROOT

const _getAssetPath = (_filePath: string) => getAssetPath(_filePath, _paths)

logger.info(`Parsing init.sh ${_path}/init.sh.template ...`)

// get it from the recipe origin or from here
const _init_template_Path = _getAssetPath(`init.sh.template`)

const _init_sh =
    FS.readFileSync(
        `${_init_template_Path}`,
        "utf-8"
    ).replace(
        /{{MACHINE}}/g,
        MACHINE
    )

// dump the parsed file using sudo tee
execSync(
    `sudo -k tee ${INITRAMFS_PATH}/init > /dev/null`,
    {
        input: _init_sh,
        shell: "/bin/bash",
        stdio: ["pipe", "inherit", "inherit"],
        encoding: "utf-8",
        env: process.env
    })

execSync(
    `sudo -k chmod +x ${INITRAMFS_PATH}/init`,
    {
        shell: "/bin/bash",
        stdio: "inherit",
        encoding: "utf-8",
        env: process.env
    })

// copy the busybox static to the initramfs
execSync(
    `sudo -k ` +
    `cp ${IMAGE_MNT_ROOT}/usr/bin/busybox ${INITRAMFS_PATH}/bin/busybox`,
    {
        shell: "/bin/bash",
        stdio: "inherit",
        encoding: "utf-8",
        env: process.env
    })

// copy the common scripts to the initramfs
// live install needs some special handling and is specific for intel
execSync(
    `sudo -k ` +
    `cp ${_path}/scripts/90-root-intel.sh ${INITRAMFS_PATH}/scripts/90-root.sh`,
    {
        shell: "/bin/bash",
        stdio: "inherit",
        encoding: "utf-8",
        env: process.env
    })

// give them the right permissions
execSync(
    `sudo -k ` +
    `chmod +x ${INITRAMFS_PATH}/scripts/*`,
    {
        shell: "/bin/bash",
        stdio: "inherit",
        encoding: "utf-8",
        env: process.env
    })

logger.success("ok, initramfs is ok")
