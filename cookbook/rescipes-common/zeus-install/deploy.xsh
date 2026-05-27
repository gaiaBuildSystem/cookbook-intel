#!/usr/bin/env xonsh

# Copyright (c) 2025 MicroHobby
# SPDX-License-Identifier: MIT

# use the xonsh environment to update the OS environment
$UPDATE_OS_ENVIRON = True
# always return if a cmd fails
$XONSH_SUBPROC_CMD_RAISE_ERROR = True
$XONSH_SHOW_TRACEBACK = True

import os
import json
import subprocess
import os.path
from torizon_templates_utils.colors import print,BgColor,Color
from torizon_templates_utils.errors import Error_Out,Error


print(
    "Deploying zeus-intel ...",
    color=Color.WHITE,
    bg_color=BgColor.GREEN
)

# get the common variables
_ARCH = os.environ.get('ARCH')
_MACHINE = os.environ.get('MACHINE')
_MAX_IMG_SIZE = os.environ.get('MAX_IMG_SIZE')
_BUILD_PATH = os.environ.get('BUILD_PATH')
_DISTRO_MAJOR = os.environ.get('DISTRO_MAJOR')
_DISTRO_MINOR = os.environ.get('DISTRO_MINOR')
_DISTRO_PATCH = os.environ.get('DISTRO_PATCH')
_USER_PASSWD = os.environ.get('USER_PASSWD')

# read the meta data
meta = json.loads(os.environ.get('META', '{}'))

# get the actual script path, not the process.cwd
_path = os.path.dirname(os.path.abspath(__file__))

_IMAGE_MNT_BOOT = f"{_BUILD_PATH}/tmp/{_MACHINE}/mnt/boot"
_IMAGE_MNT_ROOT = f"{_BUILD_PATH}/tmp/{_MACHINE}/mnt/root"
_BUILD_ROOT = f"{_BUILD_PATH}/tmp/{_MACHINE}"
os.environ['IMAGE_MNT_BOOT'] = _IMAGE_MNT_BOOT
os.environ['IMAGE_MNT_ROOT'] = _IMAGE_MNT_ROOT
$BUILD_ROOT = _BUILD_ROOT


# deploy the files
# we need super cow powers
sudo -k \
    echo "🐮"

sudo cp @(_BUILD_ROOT)/zeus-intel/zig-out/bin/zeus_intel @(_IMAGE_MNT_ROOT)/usr/bin/zeus_intel
sudo chmod +x @(_IMAGE_MNT_ROOT)/usr/bin/zeus_intel
# make a symlink to the zeus-install CLI, inside the rootfs
sudo ln -sf /usr/bin/zeus_intel @(_IMAGE_MNT_ROOT)/usr/bin/zeus_install


# deploy the systemd service
sudo cp @(_path)/systemd/zeus-install.service \
    @(_IMAGE_MNT_ROOT)/etc/systemd/system/zeus-install.service

str_cmd = (
    f"sudo -k "
    f"chroot {_IMAGE_MNT_ROOT} /bin/bash -c \""
    f"systemctl enable zeus-install.service"
    f"\""
)

subprocess.run(
    str_cmd,
    shell=True,
    check=True,
    executable="/bin/bash",
    env=os.environ
)


print(
    "Deploying zeus-intel, ok",
    color=Color.WHITE,
    bg_color=BgColor.GREEN
)
