import numpy as np
import pandas as pd
import nltk
import re
from sklearn import preprocessing


def clean_str(string):
    """
    Tokenization/string cleaning for all datasets except for SST.
    Original taken from https://github.com/yoonkim/CNN_sentence/blob/master/process_data.py
    """
    string = re.sub(r"[^A-Za-z0-9(),!?\'\`]", " ", string)
    string = re.sub(r"\'s", " \'s", string)
    string = re.sub(r"\'ve", " \'ve", string)
    string = re.sub(r"n\'t", " n\'t", string)
    string = re.sub(r"\'re", " \'re", string)
    string = re.sub(r"\'d", " \'d", string)
    string = re.sub(r"\'ll", " \'ll", string)
    string = re.sub(r",", " , ", string)
    string = re.sub(r"!", " ! ", string)
    string = re.sub(r"\(", " \( ", string)
    string = re.sub(r"\)", " \) ", string)
    string = re.sub(r"\?", " \? ", string)
    string = re.sub(r"\s{2,}", " ", string)
    return string.strip().lower()

def load_hw_data_and_labels(path):
    data = []

    lines = [line.strip() for line in open(path)]
    for line in lines:
        cols = line.split('\t')
        sbj, obj, relation, sentence = cols[0], cols[1], cols[2], cols[3]

        sentence = sentence.replace(" << _sbj_ >> ", " _sbj_ ")
        sentence = sentence.replace(" << _obj_ >> ", " _obj_ ")

        tokens = nltk.word_tokenize(sentence)

        try:
            e1 = tokens.index("_sbj_")
            tokens[e1] = sbj
            e2 = tokens.index("_obj_")
            tokens[e2] = obj
        except Exception as e:
            print(sentence)
            print(e)
            continue

        sentence = " ".join(tokens)
        # sentence = clean_str(sentence)

        data.append([sentence, e1, e2, relation])

    df = pd.DataFrame(data=data, columns=["sentence", "e1_pos", "e2_pos", "relation"])
    x_text = df['sentence'].tolist()
    pos1, pos2 = get_relative_position(df)

    labelsMapping = {'country': 0,
                     'team': 1,
                     'starring': 2,
                     'director': 3,
                     'child': 4,
                     'successor': 5,
                     }
    df['label'] = [labelsMapping[r] for r in df['relation']]
    # Label Data
    y = df['label']
    labels_flat = y.values.ravel()

    labels_count = np.unique(labels_flat).shape[0]

    # convert class labels from scalars to one-hot vectors
    # 0  => [1 0 0 0 0 ... 0 0 0 0 0]
    # 1  => [0 1 0 0 0 ... 0 0 0 0 0]
    # ...
    # 18 => [0 0 0 0 0 ... 0 0 0 0 1]
    def dense_to_one_hot(labels_dense, num_classes):
        num_labels = labels_dense.shape[0]
        index_offset = np.arange(num_labels) * num_classes
        labels_one_hot = np.zeros((num_labels, num_classes))
        labels_one_hot.flat[index_offset + labels_dense.ravel()] = 1
        return labels_one_hot

    labels = dense_to_one_hot(labels_flat, labels_count)
    labels = labels.astype(np.uint8)

    return x_text, pos1, pos2, labels

def get_relative_position(df, max_sentence_length=100):
    # Position data
    pos1 = []
    pos2 = []
    for df_idx in range(len(df)):
        sentence = df.iloc[df_idx]['sentence']
        tokens = nltk.word_tokenize(sentence)
        e1 = df.iloc[df_idx]['e1_pos']
        e2 = df.iloc[df_idx]['e2_pos']

        d1 = ""
        d2 = ""
        for word_idx in range(len(tokens)):
            d1 += str((max_sentence_length - 1) + word_idx - e1) + " "
            d2 += str((max_sentence_length - 1) + word_idx - e2) + " "
        for _ in range(max_sentence_length - len(tokens)):
            d1 += "999 "
            d2 += "999 "
        pos1.append(d1)
        pos2.append(d2)

    return pos1, pos2


def batch_iter(data, batch_size, num_epochs, shuffle=True):
    """
    Generates a batch iterator for a dataset.
    """
    data = np.array(data)
    data_size = len(data)
    num_batches_per_epoch = int((len(data) - 1) / batch_size) + 1
    for epoch in range(num_epochs):
        # Shuffle the data at each epoch
        if shuffle:
            shuffle_indices = np.random.permutation(np.arange(data_size))
            shuffled_data = data[shuffle_indices]
        else:
            shuffled_data = data
        for batch_num in range(num_batches_per_epoch):
            start_index = batch_num * batch_size
            end_index = min((batch_num + 1) * batch_size, data_size)
            yield shuffled_data[start_index:end_index]


if __name__ == "__main__":
    # trainFile = 'SemEval2010_task8_all_data/SemEval2010_task8_training/TRAIN_FILE.TXT'
    # testFile = 'SemEval2010_task8_all_data/SemEval2010_task8_testing_keys/TEST_FILE_FULL.TXT'
    #
    # x_text, pos1, pos2, y = load_data_and_labels(trainFile)

    x_text, pos1, pos2, y = load_hw_data_and_labels('hw_data/ds_train.tsv')

    print(x_text[0])
    print(pos1[0])
    print(pos2[0])
    print(y[0])
