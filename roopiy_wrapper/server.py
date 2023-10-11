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


# @app.route('/extract_video', methods=['POST'])
@sock.route('/extract_video')
def extract_video(ws):
    print('extract_video')

    # body = flask.request.get_data(as_text=True)
    prepare_project_value: PrepareProjectType = json.loads(ws.receive())
    # reference_video_slice_from: str | None = None
    # reference_video_slice_duration: str | None = None
    # if prepare_project_value['Project']['referenceVideoSlice']:
    #     from_raw = prepare_project_value['Project']['referenceVideoFrom']
    #     from_float = parse_ffmpeg_time(from_raw) if from_raw else 0
    #     reference_video_slice_from = str(from_float)
    #     print(f'from: {from_raw} -> {reference_video_slice_from}')
    #
    #     to_raw = prepare_project_value['Project']['referenceVideoTo']
    #     if to_raw:
    #         to_float = parse_ffmpeg_time(to_raw)
    #         reference_video_slice_duration = str(to_float - from_float)
    #     else:
    #         assert from_raw not in (None, '', '0');
    #
    #     print(f'to: {to_raw} -> {reference_video_slice_duration}')

    work_path = prepare_project_value['Path']

    slice_video: bool = prepare_project_value['Project']['referenceVideoSlice']

    save_cut: str | None = os.path.join(work_path, 'source.mp4') if slice else None

    frames_folder = os.path.join(work_path, 'frames')
    print(f'frames_folder: {frames_folder}')
    if os.path.exists(frames_folder):
        shutil.rmtree(frames_folder)
    os.makedirs(frames_folder)

    # extract_frames(
    #     prepare_project_value['Project']['referenceVideoFile'],
    #     frames_folder,
    #     fps=30,
    #     ss=prepare_project_value['Project']['referenceVideoFrom'],
    #     to=prepare_project_value['Project']['referenceVideoDuration'],
    #     save_cut=save_cut
    # )

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
        print('ws end on process finished')
        ws.send('end')

    ws.close()
    if not prepare_project_value['Project']['referenceVideoSlice']:
        shutil.copyfile(
            prepare_project_value['Project']['referenceVideoFile'],
            os.path.join(work_path, 'source.mp4')
        )

    # return 'OK'


if __name__ == '__main__':
    logging.basicConfig(level=logging.DEBUG)
    app.run(port=8787, debug=True)
