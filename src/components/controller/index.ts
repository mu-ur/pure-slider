import Namespace from './namespace';

class Controller implements Namespace.Interface {
  static of: Namespace.Of = (view, model) => new Controller(view, model);

  public dispatch: Namespace.Dispatch = (action) => {
    switch (action.type) {
      case 'MOVE_HANDLERS': {
        this.model.update({type: 'UPDATE_CURRENTS', currents: action.currents});

        break;
      }
    }
  };

  private constructor(private readonly view: Namespace.View, private readonly model: Namespace.Model) {
    this.model.attachListener(this.listener);
  }

  private listener: Namespace.Listener = {
    update: (action) => {
      switch (action.type) {
        case 'UPDATE_CURRENTS': {
          this.view.update({type: 'MOVE_HANDLERS', currents: action.currents as Namespace.Currents<'View'>});
        }
      }
    }
  };
}

export default Controller;