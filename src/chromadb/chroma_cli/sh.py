from typing import Tuple
import subprocess


def exec_sh_cmd(cmd: str) -> Tuple[str, str]:
    """Executes a bash command.

    Args:
      cmd: The command to exectute.

    Returns:
      Tuple[str, str]: A tuple, with the first value being the output and the second the error, if there is one.
    """

    try:
        result = subprocess.run(
            cmd,
            shell=True,
            check=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )
        output = result.stdout.decode("utf-8").strip()
        err = result.stderr.decode("utf-8").strip()
        return output, err
    except subprocess.CalledProcessError as e:
        return None, str(e)
