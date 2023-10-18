"""
Usage:
    server.py [options] <root>
"""
import typing
import sys
from io import StringIO
import json

import docpie


class NoStdOut(object):
    def __init__(self):
        self.stream = StringIO()

    def __enter__(self):
        sys.stdout = self.stream

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.stream.close()
        sys.stdout = sys.__stdout__


with NoStdOut():
    import cv2
    from roopiy.faces import load_face_analyser, load_face_enhancer, load_face_swapper, enhance_face
    from roopiy.extract_video import extract_frames
    from roopiy.identify import identify_faces_in_image
    from roopiy.utils import FaceJSONEncoder, Face, dict_to_face

pie = docpie.docpie(__doc__)

with NoStdOut():
    face_analyser = load_face_analyser(pie['<root>'])
    face_enhancer = load_face_enhancer(pie['<root>'])
    face_swapper = load_face_swapper(pie['<root>'])


def identify_faces(file_path: str) -> str:
    assert file_path is not None

    faces: list[Face]
    with NoStdOut():
        _, faces = identify_faces_in_image(face_analyser, file_path)
    return json.dumps(faces, cls=FaceJSONEncoder)


class SwapInfoType(typing.TypedDict):
    source: dict
    target: dict


def swap_faces(source_image_path: str, target_image_path: str, swap_info: list[SwapInfoType]) -> str:
    frame = cv2.imread(source_image_path)
    for swap_info in swap_info:
        source_face = dict_to_face(swap_info['source'])
        target_face = dict_to_face(swap_info['target'])
        with NoStdOut():
            frame = face_swapper.get(frame, source_face, target_face, paste_back=True)
            enhance_face(face_enhancer, source_face, frame)

    # caller ensure target_image_path folder exists
    cv2.imwrite(target_image_path, frame)
    return target_image_path


sys.stdout.write('ROOPIY:STARTED\n')
sys.stdout.flush()

for line in sys.stdin:
    call_info = json.loads(line)
    payload = call_info['payload']

    match call_info['method']:
        case 'identify_faces':
            result = identify_faces(payload)
            sys.stderr.write(f'python:reply: {result}\n')
            sys.stdout.write(result)
            sys.stdout.write('\n')
            sys.stdout.flush()
        case 'swap_faces':
            sys.stdout.write(swap_faces(payload['source_image_path'], payload['target_image_path'], payload['swap_info']))
        case _:
            raise NotImplementedError(f'unknown method: {call_info["method"]}')
