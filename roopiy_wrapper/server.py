"""
Usage:
    server.py [options] <root>
"""
import logging
import json
import threading
import typing
import os
import shutil
import subprocess

import docpie
import flask
# import flask_sockets
import flask_sock

from roopiy.faces import load_face_analyser, load_face_enhancer, load_face_swapper
from roopiy.extract_video import extract_frames
from roopiy.identify import identify_faces_in_image
from roopiy.utils import FaceJSONEncoder, Face

app = flask.Flask(__name__)
sock = flask_sock.Sock(app)

pie = docpie.docpie(__doc__)

face_analyser = load_face_analyser(pie['<root>'])
face_enhancer = load_face_enhancer(pie['<root>'])
face_swapper = load_face_swapper(pie['<root>'])


@app.route('/', methods=['GET'])
def index():
    return 'Hello World'


class ProjectType(typing.TypedDict):
    referenceVideoFile: str
    referenceVideoSlice: bool
    referenceVideoFrom: str
    referenceVideoDuration: str | None
    sourceVideoFile: str


class PrepareProjectType(typing.TypedDict):
    Path: str
    Project: ProjectType


def parse_ffmpeg_time(time_str: str) -> float | int:
    float_part: str = time_str.split('.')[1] if '.' in time_str else ''
    total_seconds: int

    parts: list[str] = time_str.split(':')

    hours: str
    minutes: str
    seconds: str

    if len(parts) == 3:
        hours, minutes, seconds = parts
        total_seconds = int(hours) * 3600 + int(minutes) * 60 + int(seconds)
    elif len(parts) == 2:
        minutes, seconds = parts
        total_seconds = int(minutes) * 60 + int(seconds)
    elif len(parts) == 1:
        total_seconds = int(parts[0])
        print(f'parsed: {parts} -> {total_seconds}{float_part}')
    else:
        raise ValueError(f'Invalid time string: {time_str}')

    return total_seconds + (float(f'0.{float_part}') if float_part else 0)


@sock.route('/extract_video')
def extract_video(ws):
    logger = logging.getLogger('roopiy_wrapper.extract_video')
    logger.debug('extract_video')

    prepare_project_value: PrepareProjectType = json.loads(ws.receive())
    work_path = prepare_project_value['Path']

    slice_video: bool = prepare_project_value['Project']['referenceVideoSlice']

    save_cut: str | None = os.path.join(work_path, 'source.mp4') if slice else None

    frames_folder = os.path.join(work_path, 'frames')
    logger.debug(f'frames_folder: {frames_folder}')
    if os.path.exists(frames_folder):
        shutil.rmtree(frames_folder)
    os.makedirs(frames_folder)

    ss: str | None = str(prepare_project_value['Project']['referenceVideoFrom']) if slice_video else None
    to: str | None = str(prepare_project_value['Project']['referenceVideoDuration']) if slice_video else None

    t = threading.Thread(
        target=extract_frames,
        args=(prepare_project_value['Project']['referenceVideoFile'], frames_folder),
        kwargs={'fps': 30, 'ss': ss, 'to': to, 'save_cut': save_cut}
    )
    t.start()

    last_folder_count = 0
    while t.is_alive():
        this_folder_count = len(os.listdir(frames_folder))
        # print(this_folder_count, frames_folder)
        if last_folder_count != this_folder_count:
            last_folder_count = this_folder_count
            # print(f'send {last_folder_count}')
            ws.send(str(last_folder_count))
    else:
        logger.debug('ws end on process finished')
        ws.send('end')

    ws.close()
    if not prepare_project_value['Project']['referenceVideoSlice']:
        shutil.copyfile(
            prepare_project_value['Project']['referenceVideoFile'],
            os.path.join(work_path, 'source.mp4')
        )


@app.route('/identify_faces', methods=['GET'])
def identify_faces():
    file_path = flask.request.args.get('file')
    assert file_path is not None

    faces: list[Face]
    _, faces = identify_faces_in_image(face_analyser, file_path)
    return json.dumps(faces, cls=FaceJSONEncoder)


if __name__ == '__main__':
    logging.basicConfig(level=logging.DEBUG)
    app.run(port=8787, debug=True)
