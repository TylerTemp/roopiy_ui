export default {
    Project: {
        k: 'Project',
        v: {
            GetList: 'GetList',
            GetConfig: 'GetConfig',
            // CreateConfig: 'CreateConfig',
            GetVideoSeconds: 'GetVideoSeconds',
            CutVideoAsSource: 'CutVideoAsSource',
            CutVideoAsSourceEvent: 'Project.CutVideoAsSource.Event',
            CutVideo: 'CutVideo',
            CutVideoEvent: 'Project.CutVideo.Event',
            ExtractVideo: 'ExtractVideo',
            ExtractVideoEvent: 'Project.ExtractVideo.Event',
            ExtractFacesInProject: 'ExtractFacesInProject',
            ExtractFacesInProjectEvent: 'Project.ExtractFacesInProject.Event',
            SaveConfig: 'SaveConfig',
            // OnFolderImageCount: 'project.OnFolderImageCount',
            // OnFolderImageCountChannel: 'project.OnFolderImageCountChannel',
        }
    },
    Edit: {
        k: 'Edit',
        v: {
            GetProjectFrameFaces: 'GetProjectFrameFaces',
            GetProjectFrameFacesEvent: 'Edit.GetProjectFrameFaces.Event',
            GetImageSize: 'GetImageSize',
            GetAllFacesInFaceLib: 'GetAllFacesInFaceLib',
            SaveFaceLib: 'SaveFaceLib',
            UpdateFrameFaces: 'UpdateFrameFaces',
            UpdateFrameFacesEvent: 'Edit.UpdateFrameFaces.Event',
            GenerateProject: 'GenerateProject',
            GenerateProjectEvent: 'Edit.GenerateProject.Event',
            PreviewFrameSwap: 'PreviewFrameSwap',
        }
    },
    Util: {
        k: 'Util',
        v: {
            IdentifyFaces: 'IdentifyFaces',
            CloseDatabase: 'CloseDatabase',
        }
    }
}
