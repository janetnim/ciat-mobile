import { StatusBar } from 'expo-status-bar';
import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, ImageBackground } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';

let camera;

const App = () => {
  const [startCamera, setStartCamera] = useState(false);
  const [isLoadingPrediction, setIsLoadingPrediction] = useState(false);
  const [imagePredictionURL, setimagePredictionURL] = useState(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [cameraType, setCameraType] = useState('back');
  const [permission, requestPermission] = useCameraPermissions();

  useEffect(() => {
    if(isLoadingPrediction) {
      const formData = new FormData();
      formData.append('files', capturedImage?.uri, capturedImage?.uri);
      fetch('http://127.0.0.1:8080/v1/batch-process', {
        method: 'POST',
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: formData
        // body: JSON.stringify(formData)
      })
      .then(response => {
        loadImagePredition(response.blob());
      })
      .catch(error => {
        Alert.alert('An error occured while trying to fetch image prediction');
      });
    }
  }, [isLoadingPrediction])

  const handleStartCamera = async () => {
    setimagePredictionURL(null);
    await requestPermission();
    if (permission?.granted) {
      setStartCamera(true);
    } else {
      Alert.alert('Access denied');
    }
  }

  const takePicture = async () => {
    if (!camera) return;

    const photo = await camera.takePictureAsync();
    setCapturedImage(photo);
    setPreviewVisible(true);
  }

  const startPrediction = () => {
    setIsLoadingPrediction(true);
    setPreviewVisible(false);
  }

  const loadImagePredition = async (data) => {
    const jszip = new JSZip();
    await jszip.loadAsync(data).then(({files}) => {
      const imageFiles = Object.entries(files);
      imageFiles.forEach(([, image]) => {
        image.async('blob').then(blob => {
          setimagePredictionURL(URL.createObjectURL(blob));
        });
      });
    });
    setIsLoadingPrediction(false);
  }

  const retakePicture = () => {
    setCapturedImage(null);
    setPreviewVisible(false);
  };

  const switchCamera = () => {
    const cameraPostition = cameraType === 'back' ? 'front' : 'back';
    setCameraType(cameraPostition);
  };

  return (
    <View style={styles.container}>
      {startCamera ? (
        <View
          style={{
            flex: 1,
            width: '100%'
          }}
        >
          {(previewVisible && capturedImage) ? (
            <CameraPreview photo={capturedImage} startPrediction={startPrediction} retakePicture={retakePicture} />
          ) : imagePredictionURL ? (
            <PredictionResults imagePredictionURL={imagePredictionURL} retakePicture={retakePicture} />
          ) :
          (
            <CameraView
              facing={cameraType}
              style={{flex: 1}}
              ref={(r) => {
                camera = r
              }}
            >
              <View
                style={{
                  flex: 1,
                  width: '100%',
                  backgroundColor: 'transparent',
                  flexDirection: 'row'
                }}
              >
                <View
                  style={{
                    position: 'absolute',
                    left: '5%',
                    top: '10%',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <TouchableOpacity
                    onPress={switchCamera}
                    style={{
                      marginTop: 20,
                      height: 25,
                      width: 'fit-content'
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 20
                      }}
                    >
                      Flip Camera
                    </Text>
                  </TouchableOpacity>
                </View>
                <View
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    flexDirection: 'row',
                    flex: 1,
                    width: '100%',
                    padding: 20,
                    justifyContent: 'space-between'
                  }}
                >
                  <View
                    style={{
                      alignSelf: 'center',
                      flex: 1,
                      alignItems: 'center'
                    }}
                  >
                    <TouchableOpacity
                      onPress={takePicture}
                      style={{
                        width: 70,
                        height: 70,
                        bottom: 0,
                        borderRadius: 50,
                        backgroundColor: '#fff'
                      }}
                    />
                  </View>
                </View>
              </View>
            </CameraView>
          )}
        </View>
      ) : (
        <View
          style={{
            flex: 1,
            backgroundColor: '#fff',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          <TouchableOpacity
            onPress={handleStartCamera}
            style={{
              width: 130,
              borderRadius: 4,
              backgroundColor: '#14274e',
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
              height: 40
            }}
          >
            <Text
              style={{
                color: '#fff',
                fontWeight: 'bold',
                textAlign: 'center'
              }}
            >
              Take picture
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <StatusBar style="auto" />
    </View>
  );
}

const CameraPreview = ({photo, retakePicture, startPrediction}) => {
  return (
    <View
      style={{
        backgroundColor: 'transparent',
        flex: 1,
        width: '100%',
        height: '100%'
      }}
    >
      <ImageBackground
        source={{uri: photo?.uri}}
        style={{
          flex: 1
        }}
      >
        <View
          style={{
            flex: 1,
            flexDirection: 'column',
            padding: 15,
            justifyContent: 'flex-end'
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between'
            }}
          >
            <TouchableOpacity
              onPress={retakePicture}
              style={{
                width: 130,
                height: 40,

                alignItems: 'center',
                borderRadius: 4
              }}
            >
              <Text
                style={{
                  color: '#fff',
                  fontSize: 20
                }}
              >
                Re-take
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={startPrediction}
              style={{
                width: 'fit-content',
                height: 40,

                alignItems: 'center',
                borderRadius: 4
              }}
            >
              <Text
                style={{
                  color: '#fff',
                  fontSize: 20
                }}
              >
                Run prediction
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ImageBackground>
    </View>
  );
};

const PredictionResults = ({imagePredictionURL, retakePicture}) => {
  return (
    <View
      style={{
        backgroundColor: 'transparent',
        flex: 1,
        width: '100%',
        height: '100%'
      }}
    >
      <ImageBackground
        source={{uri: imagePredictionURL}}
        style={{
          flex: 1
        }}
      >
        <View
          style={{
            flex: 1,
            flexDirection: 'column',
            padding: 15,
            justifyContent: 'flex-end'
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between'
            }}
          >
            <TouchableOpacity
              onPress={retakePicture}
              style={{
                width: 130,
                height: 40,

                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 4
              }}
            >
              <Text
                style={{
                  color: '#fff',
                  fontSize: 20
                }}
              >
                Take another photo
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center'
  }
});

export default App;
